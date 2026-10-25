import { useCallback, useState } from 'react';
import { approveReturnRequest, completeReturnRequest, getReturnRequestDetail, getReturnRequests, rejectReturnRequest } from '../../api/returnRequests';
import { useAsync } from '../../hooks/useAsync';
import { useQueryState } from '../../hooks/useQueryState';
import { useSubmit } from '../../hooks/useSubmit';
import { DEFAULT_PAGE_SIZE, ITEM_STATUS_LABEL, RETURN_STATUS, RETURN_STATUS_LABEL } from '../../constants/codes';
import { formatDate, formatDateTime } from '../../utils/format';
import { toServerPage } from '../../utils/query';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import { Field, Input, Select } from '../../components/common/Form';
import styles from './Returns.module.css';

const requestNo = (id) => `RT-${String(id).padStart(3, '0')}`;

// 반환 신청 처리 목록(POL-007). 승인과 실제 인계 완료를 구분한다.
// 경찰용 목록 API는 items만 주므로 전체 페이지 수 대신 이전·다음만 제공한다.
export default function PoliceReturnListPage() {
    const { get, update, page, setPage } = useQueryState();
    const status = RETURN_STATUS[get('status')] ? get('status') : '';
    const loader = useCallback(() => getReturnRequests({ status, page: toServerPage(page), size: DEFAULT_PAGE_SIZE }), [status, page]);
    const { data, error, loading, reload } = useAsync(loader);
    const [target, setTarget] = useState(null);
    const [completeTarget, setCompleteTarget] = useState(null);
    const [notice, setNotice] = useState('');
    const complete = useSubmit();
    const items = data?.items ?? [];

    const handleProcessed = (message) => {
        setTarget(null);
        setNotice(message);
        reload();
    };

    const handleComplete = async () => {
        const result = await complete.submit(() => completeReturnRequest(completeTarget.requestId));
        if (result) {
            setCompleteTarget(null);
            setNotice('물품 인계를 완료했습니다. 분실물·습득물이 반환 완료로 바뀌었습니다.');
            reload();
        }
    };

    const columns = [
        { key: 'requestId', header: '신청번호', mono: true, render: (row) => requestNo(row.requestId) },
        { key: 'requesterName', header: '신청인', render: (row) => row.requesterName ?? `회원 ${row.requesterId}` },
        {
            key: 'lost',
            header: '분실물',
            render: (row) => (
                <>
                    <span className={`${styles.code} num caption2`}>{row.lostItemId}</span> {row.lostItemName}
                </>
            ),
        },
        {
            key: 'found',
            header: '습득물',
            render: (row) => (
                <>
                    <span className={`${styles.code} num caption2`}>{row.foundItemId}</span> {row.foundItemName}
                </>
            ),
        },
        { key: 'createdAt', header: '신청일시', mono: true, render: (row) => formatDateTime(row.createdAt) },
        {
            key: 'status',
            header: '상태',
            render: (row) => (
                <StatusBadge
                    code={row.status}
                    labels={{ ...RETURN_STATUS_LABEL, APPROVED: '승인 (인계 대기)' }}
                />
            ),
        },
        {
            key: 'action',
            header: '',
            render: (row) =>
                row.status === RETURN_STATUS.PENDING ? (
                    <Button size="sm" onClick={() => setTarget(row)}>
                        비교·처리
                    </Button>
                ) : row.status === RETURN_STATUS.APPROVED ? (
                    <Button size="sm" variant="secondary" onClick={() => setCompleteTarget(row)}>
                        인계 완료
                    </Button>
                ) : null,
        },
    ];

    return (
        <>
            <PageHeader
                eyebrow="경찰 업무"
                title="반환 신청 처리"
                description="분실물과 습득물 정보를 비교해 소유 여부를 확인한 뒤 승인 또는 반려합니다. 승인 후 실제 물품을 건네면 인계 완료로 처리합니다."
                actions={
                    <Select aria-label="처리 상태" value={status} onChange={(event) => update({ status: event.target.value })}>
                        <option value="">상태 전체</option>
                        {Object.entries(RETURN_STATUS_LABEL).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </Select>
                }
            />
            {notice && <Alert tone="success">{notice}</Alert>}
            <Card padded={false}>
                <ErrorState error={error} onRetry={reload} />
                {loading && !data ? (
                    <LoadingState />
                ) : (
                    <DataTable caption="반환 신청 목록" columns={columns} rows={items} rowKey={(row) => row.requestId} emptyText="반환 신청이 없습니다." />
                )}
                <div className={styles.pager}>
                    <Pagination page={page} hasNext={items.length === DEFAULT_PAGE_SIZE} onPageChange={setPage} />
                </div>
            </Card>
            {target && <CompareModal request={target} onClose={() => setTarget(null)} onProcessed={handleProcessed} />}
            <Modal
                open={Boolean(completeTarget)}
                title="인계 완료 처리"
                onClose={() => setCompleteTarget(null)}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCompleteTarget(null)}>
                            취소
                        </Button>
                        <Button onClick={handleComplete} loading={complete.submitting} loadingText="처리 중…">
                            인계 완료
                        </Button>
                    </>
                }
            >
                <ErrorState error={complete.error} />
                {completeTarget && (
                    <p className="body2">
                        {requestNo(completeTarget.requestId)} 신청의 물품을 신청인에게 건넸나요? 완료하면 분실물·습득물이 모두 반환 완료로 바뀝니다.
                    </p>
                )}
            </Modal>
        </>
    );
}

function ItemColumn({ title, id, name, description, location, occurredAt, status }) {
    return (
        <section className={styles.itemCol}>
            <header className={styles.itemHead}>
                <h3 className="title3">{title}</h3>
                <span className={`${styles.code} num caption2`}>{id}</span>
                <StatusBadge code={status} labels={ITEM_STATUS_LABEL} />
            </header>
            <dl className={`${styles.dl} body2`}>
                <dt>물품</dt>
                <dd>{name}</dd>
                <dt>일자</dt>
                <dd className="num">{formatDate(occurredAt)}</dd>
                <dt>장소</dt>
                <dd>{location}</dd>
                <dt>특징</dt>
                <dd>{description}</dd>
            </dl>
        </section>
    );
}

// 반환 신청 비교·처리(POL-008)
function CompareModal({ request, onClose, onProcessed }) {
    const loader = useCallback(() => getReturnRequestDetail(request.requestId), [request.requestId]);
    const { data, error, loading } = useAsync(loader);
    const [reason, setReason] = useState('');
    const action = useSubmit();

    const approve = async () => {
        const result = await action.submit(() => approveReturnRequest(request.requestId));
        if (result) {
            onProcessed('승인했습니다. 분실물·습득물이 인계 대기로 바뀌었습니다. 물품을 건넨 뒤 인계 완료를 눌러 주세요.');
        }
    };

    const reject = async () => {
        const result = await action.submit(() => rejectReturnRequest(request.requestId, reason.trim()));
        if (result) {
            onProcessed('반려했습니다.');
        }
    };

    return (
        <Modal
            open
            wide
            title={`반환 신청 ${requestNo(request.requestId)} 처리`}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" className={styles.cancel} onClick={onClose}>
                        취소
                    </Button>
                    <Button variant="dangerOutline" disabled={!reason.trim() || !data} loading={action.submitting} loadingText="처리 중…" onClick={reject}>
                        반려
                    </Button>
                    <Button disabled={!data} loading={action.submitting} loadingText="처리 중…" onClick={approve}>
                        소유 확인 · 승인
                    </Button>
                </>
            }
        >
            <ErrorState error={error} />
            <ErrorState error={action.error} />
            {loading && !data && <LoadingState />}
            {data && (
                <>
                    <div className={styles.compare}>
                        <ItemColumn
                            title="분실물 (신청인)"
                            id={data.lostItemId}
                            name={data.lostItemName}
                            description={data.lostItemDescription}
                            location={data.lostItemLocation}
                            occurredAt={data.lostOccurredAt}
                            status={data.lostItemStatus}
                        />
                        <ItemColumn
                            title="습득물"
                            id={data.foundItemId}
                            name={data.foundItemName}
                            description={data.foundItemDescription}
                            location={data.foundItemLocation}
                            occurredAt={data.foundOccurredAt}
                            status={data.foundItemStatus}
                        />
                    </div>
                    <p className={`${styles.reason} body2`}>
                        <b>신청 사유</b> {data.requestReason}
                    </p>
                    <Field label="처리 사유 (반려 시 필수)" hint="승인 API는 사유를 저장하지 않습니다. 반려 사유는 신청 내역에 기록됩니다.">
                        {(props) => (
                            <Input
                                {...props}
                                placeholder="예: 특징·각인 일치 확인, 신분증 대조 완료"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                            />
                        )}
                    </Field>
                </>
            )}
        </Modal>
    );
}
