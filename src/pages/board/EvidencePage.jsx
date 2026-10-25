import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router';
import { getEvidences } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { EVIDENCE_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import Icon from '../../components/common/Icon';
import Tag from '../../components/common/Tag';
import { Button } from '../../components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import { EvidenceFormModal } from '../../components/board/BoardModals';
import { EvidenceFileLine, EvidenceThumb } from '../../components/board/EvidenceFile';
import { useEvidenceFile } from '../../hooks/useEvidenceFile';
import styles from './Board.module.css';

// 증거물 카드. 첨부 파일은 목록 응답의 fileUrl로 인증 요청을 보내 받아 온다. 첨부가 없으면 요청하지 않는다.
function EvidenceCard({ item, officerName }) {
    const loaded = useEvidenceFile(item.fileUrl);
    const file = item.fileUrl ? loaded : null;

    return (
        <article className={styles.evd}>
            <span className={styles.evdImg}>
                <EvidenceThumb file={file} evidenceType={item.evidenceType} name={item.evidenceName} />
            </span>
            <div className={styles.rowBody}>
                <p className={`${styles.evdHead} caption2`}>
                    <span className="num">{item.evidenceId}</span>
                    <Tag tone="blue">{labelOf(EVIDENCE_TYPE_LABEL, item.evidenceType)}</Tag>
                </p>
                <h3 className="title3">{item.evidenceName}</h3>
                <dl className={`${styles.evdDl} caption1`}>
                    <dt>확보 일시</dt>
                    <dd className="num">{formatDateTime(item.acquiredAt)}</dd>
                    <dt>확보 장소</dt>
                    <dd>{item.acquiredLocation}</dd>
                    <dt>등록자</dt>
                    <dd>{officerName}</dd>
                    <dt>메모</dt>
                    <dd>{item.description || '-'}</dd>
                </dl>
            </div>
            <p className={`${styles.evdFiles} caption1`}>
                <Icon name="clip" size={13} />
                <EvidenceFileLine file={file} evidenceId={item.evidenceId} />
            </p>
        </article>
    );
}

// 증거물 관리(POL-011): 등록 순 전체를 카드 안에서 상세 내역까지 보여 준다. 단건 조회 화면은 없다.
export default function EvidencePage() {
    const { caseId, locked, officerName, reloadBoard } = useOutletContext();
    const loader = useCallback(() => getEvidences(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);
    const [open, setOpen] = useState(false);

    const saved = () => {
        setOpen(false);
        reload();
        reloadBoard();
    };

    return (
        <section className={styles.nc}>
            <header className={styles.ncHead}>
                <h2 className="title3">
                    <Icon name="evidence" />
                    증거물 관리 <span className={`${styles.count} num`}>({data?.length ?? 0})</span>
                </h2>
                <div className={styles.ncActions}>
                    <Button size="sm" disabled={locked} onClick={() => setOpen(true)}>
                        + 등록
                    </Button>
                </div>
            </header>
            <div className={styles.ncBody}>
                <ErrorState error={error} onRetry={reload} />
                {loading && !data && <LoadingState />}
                {data && data.length === 0 && <EmptyState title="등록된 증거물이 없습니다" />}
                <div className={styles.evdGrid}>
                    {(data ?? []).map((item) => (
                        <EvidenceCard key={item.evidenceId} item={item} officerName={officerName} />
                    ))}
                </div>
            </div>
            <EvidenceFormModal open={open} caseId={caseId} officerName={officerName} onClose={() => setOpen(false)} onSaved={saved} />
        </section>
    );
}
