import { useCallback } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateHypotheses } from '../api/investigations';
import { nowDateTimeInput } from '../utils/format';
import { useAuthStore } from './authStore';

// AI 사건 추론은 1분 이상 걸릴 수 있어 요청과 결과를 화면이 아닌 이 스토어가 들고 있는다.
// 수사 보드의 다른 탭이나 다른 화면으로 이동해도 추론이 이어지고, 돌아오면 결과를 볼 수 있다.
// 후보는 서버 DB에 저장되지 않으므로 끝난 결과만 탭 단위(sessionStorage)로 보관해 새로고침 후에도 보여 준다.
// 로그인 사용자와 사건 단위로 구분하고, 로그아웃하면 모두 지운다.
const EMPTY_RUN = { status: 'idle', startedAt: null, finishedAt: null, error: null, analysis: null, checked: {}, unseen: false };
const INTERRUPTED_MESSAGE = '새로고침으로 AI 추론이 중단되었습니다. 다시 실행해 주세요.';

const keyOf = (userId, caseId) => `${userId}:${caseId}`;

// 진행 중이던 요청은 새로고침하면 응답을 받을 수 없으므로 중단으로 바꾼다. 직전 결과는 그대로 둔다.
const restoreRuns = (runs = {}) =>
    Object.fromEntries(
        Object.entries(runs).map(([key, run]) => [
            key,
            run.status === 'running' ? { ...run, status: 'error', finishedAt: Date.now(), error: { message: INTERRUPTED_MESSAGE } } : run,
        ])
    );

export const useAiInferenceStore = create(
    persist(
        (set, get) => {
            const patch = (key, updater) =>
                set((state) => {
                    const current = state.runs[key] ?? EMPTY_RUN;
                    return { runs: { ...state.runs, [key]: { ...current, ...updater(current) } } };
                });

            return {
                runs: {},

                // 한 사건에서는 추론을 한 번에 하나만 돌린다. 이미 진행 중이면 false를 돌려준다.
                start: async (key, caseId) => {
                    if (get().runs[key]?.status === 'running') {
                        return false;
                    }
                    patch(key, () => ({ status: 'running', startedAt: Date.now(), finishedAt: null, error: null }));
                    try {
                        const response = await generateHypotheses(caseId);
                        const candidates = [...(response.hypotheses ?? [])].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
                        patch(key, (run) => ({
                            status: 'done',
                            finishedAt: Date.now(),
                            unseen: true,
                            checked: {},
                            analysis: {
                                round: (run.analysis?.round ?? 0) + 1,
                                at: nowDateTimeInput(),
                                createdMs: Date.now(),
                                candidates,
                                focus: 0,
                                decisions: {},
                                adoptedId: null,
                            },
                        }));
                    } catch (error) {
                        // 실패해도 직전 추론 결과는 지우지 않는다. 저장할 수 있도록 상태 코드와 문구만 남긴다.
                        patch(key, () => ({ status: 'error', finishedAt: Date.now(), error: { status: error.status, message: error.message } }));
                    }
                    return true;
                },

                update: (key, field, updater) => patch(key, (run) => ({ [field]: typeof updater === 'function' ? updater(run[field]) : updater })),

                markSeen: (key) => patch(key, () => ({ unseen: false })),

                clear: () => set({ runs: {} }),
            };
        },
        {
            name: 'polink-ai-inference',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({ runs: state.runs }),
            merge: (persisted, current) => ({ ...current, runs: restoreRuns(persisted?.runs) }),
        }
    )
);

// 로그아웃(직접 또는 401 처리)하면 이전 사용자의 추론 결과를 남기지 않는다.
useAuthStore.subscribe((state, prev) => {
    if (prev.user && !state.user) {
        useAiInferenceStore.getState().clear();
    }
});

// 화면에서 쓰는 형태: 현재 로그인 사용자의 해당 사건 추론 상태와 조작 함수.
export function useAiRun(caseId) {
    const userId = useAuthStore((state) => state.user?.userId);
    const key = keyOf(userId, caseId);
    const run = useAiInferenceStore((state) => state.runs[key]) ?? EMPTY_RUN;
    const startRun = useAiInferenceStore((state) => state.start);
    const update = useAiInferenceStore((state) => state.update);
    const markSeenRun = useAiInferenceStore((state) => state.markSeen);

    const start = useCallback(() => startRun(key, caseId), [startRun, key, caseId]);
    const setAnalysis = useCallback((updater) => update(key, 'analysis', updater), [update, key]);
    const setChecked = useCallback((updater) => update(key, 'checked', updater), [update, key]);
    const markSeen = useCallback(() => markSeenRun(key), [markSeenRun, key]);

    return { run, running: run.status === 'running', start, setAnalysis, setChecked, markSeen };
}
