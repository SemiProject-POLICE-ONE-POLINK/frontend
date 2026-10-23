import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { formatDateTime } from '../../utils/format';
import Icon from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/Feedback';
import { LogFormModal } from '../../components/board/BoardModals';
import styles from './Board.module.css';

// 수사 기록(POL-013): 등록 순 전체. 등록한 기록은 수정·삭제하지 않는다.
// 목록은 수사 보드 레이아웃이 이미 조회한 결과를 그대로 쓴다.
export default function InvestigationLogPage() {
    const { caseId, logs, locked, officerName, reloadBoard } = useOutletContext();
    const [open, setOpen] = useState(false);

    const saved = () => {
        setOpen(false);
        reloadBoard();
    };

    return (
        <section className={styles.nc}>
            <header className={styles.ncHead}>
                <h2 className="title3">
                    <Icon name="log" />
                    수사 기록 <span className={`${styles.count} num`}>({logs.length})</span>
                </h2>
                <div className={styles.ncActions}>
                    <Button size="sm" disabled={locked} onClick={() => setOpen(true)}>
                        + 작성
                    </Button>
                </div>
            </header>
            <div className={styles.ncBody}>
                {logs.length === 0 ? (
                    <EmptyState title="등록된 수사 기록이 없습니다" />
                ) : (
                    <ol className={styles.timeline}>
                        {logs.map((log) => (
                            <li key={log.logId}>
                                <p className={`${styles.muted} caption1`}>
                                    <span className="num">{formatDateTime(log.investigatedAt)}</span> · {officerName}
                                </p>
                                <p className="label">{log.content}</p>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
            <LogFormModal open={open} caseId={caseId} officerName={officerName} onClose={() => setOpen(false)} onSaved={saved} />
        </section>
    );
}
