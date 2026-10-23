import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router';
import { getWitnesses } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime } from '../../utils/format';
import Icon from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import { StatementFormModal, WitnessFormModal } from '../../components/board/BoardModals';
import styles from './Board.module.css';

const STATEMENT_TONE = {
    INITIAL: styles.kFirst,
    ADDITIONAL: styles.kAdd,
    CORRECTION: styles.kFix,
    REVERSAL: styles.kRev,
};

// 목격자 관리(POL-012): 목격자는 등록 순, 진술은 목격자별 시간 순 전체 이력. 기존 진술은 수정하지 않는다.
export default function WitnessPage() {
    const { caseId, locked, reloadBoard } = useOutletContext();
    const loader = useCallback(() => getWitnesses(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);
    const [registerOpen, setRegisterOpen] = useState(false);
    const [statementTarget, setStatementTarget] = useState(null);

    const saved = () => {
        setRegisterOpen(false);
        setStatementTarget(null);
        reload();
        reloadBoard();
    };

    return (
        <section className={styles.nc}>
            <header className={styles.ncHead}>
                <h2 className="title3">
                    <Icon name="witness" />
                    목격자 관리 <span className={`${styles.count} num`}>({data?.length ?? 0})</span>
                </h2>
                <div className={styles.ncActions}>
                    <Button size="sm" disabled={locked} onClick={() => setRegisterOpen(true)}>
                        + 등록
                    </Button>
                </div>
            </header>
            <div className={styles.ncBody}>
                <ErrorState error={error} onRetry={reload} />
                {loading && !data && <LoadingState />}
                {data && data.length === 0 && <EmptyState title="등록된 목격자가 없습니다" />}
                {(data ?? []).map((witness) => (
                    <article key={witness.witnessId} className={styles.witness}>
                        <span className={`${styles.code} num caption2`}>{witness.witnessId}</span>
                        <div className={styles.rowBody}>
                            <p className={`${styles.rowTitle} label`}>
                                <span className={`${styles.avatar} ${styles.avatarSm} label`} aria-hidden="true">
                                    {witness.name[0]}
                                </span>
                                {witness.name}
                                <span className={`${styles.muted} caption1`}>
                                    · {witness.relationship} · <span className="num">{witness.phone}</span>
                                </span>
                            </p>
                            <ol className={styles.statements} aria-label={`${witness.name} 진술 이력`}>
                                {witness.statements.map((statement) => (
                                    <li key={statement.statementId} className={styles.stmt}>
                                        <p className="caption1">
                                            <span className={`${styles.stmtKind} ${STATEMENT_TONE[statement.statementType] ?? ''} micro`}>
                                                {STATEMENT_TYPE_LABEL[statement.statementType]}
                                            </span>
                                            <span className={`${styles.muted} num`}>{formatDateTime(statement.createdAt)}</span>
                                        </p>
                                        <p className="body2">{statement.content}</p>
                                    </li>
                                ))}
                            </ol>
                            <div>
                                <Button size="sm" variant="secondary" disabled={locked} onClick={() => setStatementTarget(witness)}>
                                    진술 추가
                                </Button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            <WitnessFormModal open={registerOpen} caseId={caseId} onClose={() => setRegisterOpen(false)} onSaved={saved} />
            <StatementFormModal caseId={caseId} witness={statementTarget} onClose={() => setStatementTarget(null)} onSaved={saved} />
        </section>
    );
}
