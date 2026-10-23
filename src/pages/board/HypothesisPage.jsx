import { useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { getAdoptedHypotheses, getEvidences, getWitnesses } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { formatDateTime } from '../../utils/format';
import { buildBasisLookup, toCheckItems } from '../../utils/hypothesis';
import Icon from '../../components/common/Icon';
import Tag from '../../components/common/Tag';
import StatusBadge from '../../components/common/StatusBadge';
import { ButtonLink } from '../../components/common/Button';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { BasisChips, Confidence, SourceTag } from '../../components/board/HypothesisParts';
import styles from './Board.module.css';

const loadHypotheses = (caseId) =>
    Promise.all([getAdoptedHypotheses(caseId), getEvidences(caseId), getWitnesses(caseId)]).then(([adopted, evidences, witnesses]) => ({
        adopted: [...adopted].sort((a, b) => String(b.adoptedAt).localeCompare(String(a.adoptedAt))),
        lookup: buildBasisLookup(evidences, witnesses),
    }));

// 수사 가설(POL-014): 채택한 가설만 최근 채택 순으로 누적해 보여 준다. 채택한 가설은 수정·삭제하지 않는다.
export default function HypothesisPage() {
    const { caseId, locked } = useOutletContext();
    const loader = useCallback(() => loadHypotheses(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);

    if (loading && !data) {
        return <LoadingState />;
    }
    if (!data) {
        return <ErrorState error={error} onRetry={reload} />;
    }
    if (data.adopted.length === 0) {
        return (
            <section className={styles.nc}>
                <div className={styles.aiEmpty}>
                    <h2 className="title2">아직 채택한 수사 가설이 없습니다.</h2>
                    <p className="body2">AI 사건 추론에서 가설 3개를 받아 하나를 채택하면 근거 자료, AI 분석 근거, 추가 확인 항목이 함께 저장됩니다.</p>
                    {!locked && (
                        <ButtonLink to={`/board/${caseId}/ai`}>
                            <Icon name="ai" size={14} /> AI 사건 추론으로 이동
                        </ButtonLink>
                    )}
                </div>
            </section>
        );
    }

    const total = data.adopted.length;
    return (
        <>
            <ErrorState error={error} onRetry={reload} />
            {data.adopted.map((item, index) => {
                const checks = toCheckItems(item.additionalRecommendation);
                return (
                    <div key={item.hypothesisId} className={styles.hfull}>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <h2 className="title3">
                                    채택된 수사 가설 <span className={`${styles.count} num`}>{total - index} / {total}</span>
                                </h2>
                                {index === 0 && total > 1 && <Tag tone="gold">최근 채택</Tag>}
                            </header>
                            <div className={`${styles.ncBody} ${styles.hbody}`}>
                                <p className={styles.inline}>
                                    <SourceTag source={item.source} />
                                    <StatusBadge code="ADOPTED" labels={{ ADOPTED: '채택' }} tone="done" />
                                    <span className={`${styles.muted} caption1`}>
                                        채택 {item.adoptedByName} · <span className="num">{formatDateTime(item.adoptedAt)}</span>
                                    </span>
                                </p>
                                <h3 className="title2">{item.content}</h3>
                                {/* 신뢰도는 AI 가설만 표시한다. */}
                                {item.source === 'AI' && <Confidence value={item.confidence} />}
                                <div>
                                    <p className={`${styles.muted} caption2`}>근거 자료</p>
                                    <BasisChips
                                        evidenceIds={item.basis?.evidenceIds}
                                        statementIds={item.basis?.statementIds}
                                        circumstances={item.basis?.circumstances}
                                        lookup={data.lookup}
                                    />
                                </div>
                                {item.reason && (
                                    <div className={styles.why}>
                                        <b className="caption2">AI 분석 근거</b>
                                        <p className="body2">{item.reason}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <h2 className="title3">
                                    추가로 확인할 것 <span className={`${styles.count} num`}>({checks.length})</span>
                                </h2>
                            </header>
                            <div className={styles.ncBody}>
                                {checks.length === 0 ? (
                                    <p className={`${styles.muted} body2`}>채택할 때 AI가 제안한 확인 항목이 없습니다.</p>
                                ) : (
                                    <ul className={styles.checkList}>
                                        {checks.map((text) => (
                                            <li key={text} className="body2">
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className={`${styles.muted} caption1`}>완료 체크 저장 API가 준비되면 항목별 완료 표시를 연동합니다.</p>
                            </div>
                        </section>
                    </div>
                );
            })}
            <p className={`${styles.muted} caption1`}>
                한 번 분석할 때마다 가설 하나를 채택할 수 있고, 채택한 가설은 최근 채택 순으로 누적 저장됩니다. 기각하거나 채택하지 않은 AI 가설은 저장되지 않습니다.
            </p>
        </>
    );
}
