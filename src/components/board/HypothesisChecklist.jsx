import { useCallback, useState } from 'react';
import { getHypothesisChecklist, updateHypothesisCheckItem } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { useSubmit } from '../../hooks/useSubmit';
import { toCheckItems } from '../../utils/hypothesis';
import { ErrorState, LoadingState } from '../common/Feedback';
import styles from '../../pages/board/Board.module.css';

// 채택된 가설 하나의 '추가로 확인할 것' 체크리스트(POL-014).
// itemId는 가설마다 1부터 다시 매겨지므로 조회·저장 상태를 가설 단위 컴포넌트가 따로 가진다.
// 체크 상태는 서버 응답으로만 바꾼다. 저장이 실패하면 화면은 직전 저장 상태를 그대로 보여 준다.
export default function HypothesisChecklist({ caseId, hypothesisId, fallbackText, editable }) {
    const loader = useCallback(() => getHypothesisChecklist(caseId, hypothesisId), [caseId, hypothesisId]);
    const { data, error, loading, reload } = useAsync(loader);
    const [saved, setSaved] = useState(null);
    const { submit, submitting, error: saveError, clearError } = useSubmit();

    const checklist = saved ?? data;
    const items = checklist?.checkItems ?? [];
    const doneCount = items.filter((item) => item.completed).length;

    const toggle = async (item) => {
        const result = await submit(() => updateHypothesisCheckItem(caseId, hypothesisId, item.itemId, !item.completed));
        if (result) {
            setSaved(result);
        }
    };

    // 409 등으로 저장이 거절되면 서버의 최신 저장 상태를 다시 받아 온다.
    const refresh = () => {
        clearError();
        setSaved(null);
        reload();
    };

    return (
        <section className={styles.nc}>
            <header className={styles.ncHead}>
                <h2 className="title3">
                    추가로 확인할 것{' '}
                    <span className={`${styles.count} num`}>{checklist ? `(${doneCount} / ${items.length})` : ''}</span>
                </h2>
            </header>
            <div className={styles.ncBody}>
                {loading && !checklist && <LoadingState text="체크리스트를 불러오는 중입니다…" />}
                {!checklist && <ErrorState error={error} onRetry={reload} />}
                {/* 체크리스트를 불러오지 못해도 채택 당시 원문 항목은 읽을 수 있게 둔다. */}
                {!checklist && error && <FallbackList text={fallbackText} />}
                {checklist && items.length === 0 && <p className={`${styles.muted} body2`}>채택할 때 AI가 제안한 확인 항목이 없습니다.</p>}
                {items.length > 0 && (
                    <div role="group" aria-label="추가로 확인할 것 체크리스트" aria-busy={submitting}>
                        {items.map((item) => (
                            <label key={item.itemId} className={`${styles.check} body2`}>
                                <input
                                    type="checkbox"
                                    checked={item.completed}
                                    disabled={!editable || submitting}
                                    onChange={() => toggle(item)}
                                />
                                <span>{item.content}</span>
                            </label>
                        ))}
                    </div>
                )}
                <ErrorState error={saveError} onRetry={refresh} />
                {/* 저장 중 안내는 화면에 띄우지 않고 스크린 리더에만 읽힌다. */}
                <p className="visually-hidden" role="status">
                    {submitting ? '체크 상태를 저장하는 중입니다…' : ''}
                </p>
                {checklist && items.length > 0 && !editable && (
                    <p className={`${styles.muted} caption1`}>수사 중인 사건의 담당 경찰만 체크 상태를 바꿀 수 있습니다. 지금은 조회만 가능합니다.</p>
                )}
            </div>
        </section>
    );
}

function FallbackList({ text }) {
    const lines = toCheckItems(text);
    if (lines.length === 0) {
        return null;
    }
    return (
        <ul className={styles.checkList}>
            {lines.map((line) => (
                <li key={line} className="body2">
                    {line}
                </li>
            ))}
        </ul>
    );
}
