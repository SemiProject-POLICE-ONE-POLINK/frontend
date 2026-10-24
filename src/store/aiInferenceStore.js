import { useCallback } from 'react';
import { create } from 'zustand';
import { generateHypotheses } from '../api/investigations';
import { nowDateTimeInput } from '../utils/format';
import { useAuthStore } from './authStore';

// AI 사건 추론은 1분 이상 걸릴 수 있어 요청과 결과를 화면이 아닌 이 스토어가 들고 있는다.
// 수사 보드의 다른 탭이나 다른 화면으로 이동해도 추론이 이어지고, 돌아오면 결과를 볼 수 있다.
// 후보는 서버에 저장되지 않는 값이라 새로고침하면 사라진다. 로그인 사용자와 사건 단위로 구분한다.
const EMPTY_RUN = { status: 'idle', startedAt: null, finishedAt: null, error: null, analysis: null, checked: {}, unseen: false };

const keyOf = (userId, caseId) => `${userId}:${caseId}`;

export const useAiInferenceStore = create((set, get) => {
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
                    analysis: { round: (run.analysis?.round ?? 0) + 1, at: nowDateTimeInput(), candidates, focus: 0, decisions: {}, adoptedId: null },
                }));
            } catch (error) {
                // 실패해도 직전 추론 결과는 지우지 않는다.
                patch(key, () => ({ status: 'error', finishedAt: Date.now(), error }));
            }
            return true;
        },

        update: (key, field, updater) => patch(key, (run) => ({ [field]: typeof updater === 'function' ? updater(run[field]) : updater })),

        markSeen: (key) => patch(key, () => ({ unseen: false })),
    };
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
