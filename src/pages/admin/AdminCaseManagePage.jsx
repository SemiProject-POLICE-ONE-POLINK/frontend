import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import { closeCase, getCaseDetail } from '../../api/cases';
import { useAsync } from '../../hooks/useAsync';
import { useSubmit } from '../../hooks/useSubmit';
import { CASE_STATUS, CASE_STATUS_LABEL, CASE_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import { Field, Input, Textarea } from '../../components/common/Form';
import { Stack } from '../../components/common/Layout';
import AssignOfficerModal from '../../components/case/AssignOfficerModal';
import { EvidenceCard, InvestigationLogCard, WitnessCard } from '../../components/case/CaseRecords';
import modalStyles from '../../components/case/CaseModals.module.css';
import styles from '../case/CasePage.module.css';

// 관리자 사건 상세(ADM-002). 버튼 노출 규칙:
// 미배정 — 담당 경찰 배정·접수 취소 표시 / 수사 중 — 담당 변경 표시 / 종결 대기 — 사건 종결만 가능 /
// 종결·취소 사건 — 처리 버튼 모두 숨김. 사건 종결은 담당 경찰이 수사를 종결한 종결 대기 상태에서만 허용한다.
export default function AdminCaseManagePage() {
    const { caseId } = useParams();
    const loader = useCallback(() => getCaseDetail(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);
    const [modal, setModal] = useState(null);
    const [notice, setNotice] = useState('');

    const finished = data && (data.status === CASE_STATUS.CLOSED || data.status === CASE_STATUS.CANCELED);
    const assigned = Boolean(data?.assignedOfficerId);
    const closePending = data?.status === CASE_STATUS.INVESTIGATION_DONE;

    const handleAssigned = (result) => {
        setModal(null);
        setNotice(
            assigned
                ? `담당 경찰을 회원 번호 ${result.assignedOfficerId}(으)로 변경했습니다. 사건 접근 권한도 갱신되었습니다.`
                : `회원 번호 ${result.assignedOfficerId} 경찰을 배정했습니다. 사건·수사 상태가 ‘수사 중’으로 바뀌었습니다.`
        );
        reload();
    };

    const handleClosed = (result) => {
        setModal(null);
        setNotice(`사건을 종결했습니다. (${formatDateTime(result.closedAt)})`);
        reload();
    };

    const actions = data && !finished && (
        <>
            {!assigned && <Button onClick={() => setModal('assign')}>담당 경찰 배정</Button>}
            {assigned && !closePending && (
                <Button variant="secondary" onClick={() => setModal('assign')}>
                    담당 변경
                </Button>
            )}
            <Button variant={closePending ? 'primary' : 'secondary'} onClick={() => setModal(closePending ? 'close' : 'cannotClose')}>
                사건 종결
            </Button>
            {!assigned && (
                <Button variant="dangerOutline" onClick={() => setModal('cancel')}>
                    접수 취소
                </Button>
            )}
        </>
    );

    return (
        <>
            <Link className={`${styles.back} body2`} to="/cases">
                ← 사건 목록
            </Link>
            {notice && <Alert tone="success">{notice}</Alert>}
            {closePending && !notice && <Alert tone="info">담당 경찰이 수사를 종결했습니다. 내용을 확인한 뒤 사건을 종결해 주세요.</Alert>}
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {data && (
                <>
                    <PageHeader
                        eyebrow={`${data.caseId} · ${labelOf(CASE_TYPE_LABEL, data.caseType)}`}
                        title={data.title}
                        description={
                            <span className={styles.headLine}>
                                사건 <StatusBadge code={data.status} labels={CASE_STATUS_LABEL} />
                            </span>
                        }
                        actions={actions}
                    />
                    <div className={styles.layout}>
                        <Stack gap={16}>
                            <Card title="사건 정보">
                                <dl className={`${styles.dl} body2`}>
                                    <dt>사건번호</dt>
                                    <dd className="num">{data.caseId}</dd>
                                    <dt>발생일시</dt>
                                    <dd className="num">{formatDateTime(data.occurredAt)}</dd>
                                    <dt>발생장소</dt>
                                    <dd>{data.location}</dd>
                                    <dt>신고내용</dt>
                                    <dd>{data.description}</dd>
                                </dl>
                            </Card>
                            <InvestigationLogCard caseId={caseId} officer={{ id: data.assignedOfficerId, name: data.assignedOfficerName }} />
                        </Stack>
                        <Stack gap={16}>
                            <Card title="담당 경찰" subtitle={assigned ? '1명' : '0명'}>
                                {assigned ? (
                                    <div className={styles.officer}>
                                        <span className={`${styles.avatar} label`} aria-hidden="true">
                                            {data.assignedOfficerName?.[0] ?? '경'}
                                        </span>
                                        {/* 상세 응답에 이름이 없던 서버와도 동작하도록 이름이 없으면 회원 번호로 대신한다. */}
                                        <p className="label">
                                            {data.assignedOfficerName ?? (
                                                <>
                                                    회원 번호 <span className="num">{data.assignedOfficerId}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <EmptyState title="미배정">관리자가 담당 경찰을 배정합니다.</EmptyState>
                                )}
                            </Card>
                            <EvidenceCard caseId={caseId} />
                            <WitnessCard caseId={caseId} />
                        </Stack>
                    </div>

                    <AssignOfficerModal
                        open={modal === 'assign'}
                        caseId={caseId}
                        caseTitle={data.title}
                        currentOfficerId={data.assignedOfficerId}
                        onClose={() => setModal(null)}
                        onAssigned={handleAssigned}
                    />
                    <CloseCaseModal open={modal === 'close'} caseId={caseId} onClose={() => setModal(null)} onClosed={handleClosed} />
                    <Modal
                        open={modal === 'cannotClose'}
                        title="사건을 종결할 수 없습니다"
                        onClose={() => setModal(null)}
                        footer={<Button onClick={() => setModal(null)}>확인</Button>}
                    >
                        <p className="body2">
                            종결 대기 상태인 사건만 종결할 수 있습니다. 담당 경찰이 수사 보드에서 수사를 종결하면 종결 대기로 바뀝니다.
                        </p>
                    </Modal>
                    <CancelCaseModal open={modal === 'cancel'} onClose={() => setModal(null)} />
                </>
            )}
        </>
    );
}

function CloseCaseModal({ open, caseId, onClose, onClosed }) {
    const [form, setForm] = useState({ result: '', reason: '' });
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = form.result.trim() && form.reason.trim();

    const close = () => {
        setForm({ result: '', reason: '' });
        clearError();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!filled) {
            return;
        }
        const result = await submit(() => closeCase(caseId, { result: form.result.trim(), reason: form.reason.trim() }));
        if (result) {
            setForm({ result: '', reason: '' });
            onClosed(result);
        }
    };

    return (
        <Modal
            open={open}
            title="사건 종결 처리"
            onClose={close}
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        취소
                    </Button>
                    <Button type="submit" form="close-case-form" disabled={!filled} loading={submitting} loadingText="종결 처리 중…">
                        종결
                    </Button>
                </>
            }
        >
            <Stack as="form" id="close-case-form" gap={12} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <Field label="처리 결과" required>
                    {(props) => <Input {...props} value={form.result} onChange={(event) => setForm((prev) => ({ ...prev, result: event.target.value }))} />}
                </Field>
                <Field label="종결 사유" required>
                    {(props) => (
                        <Textarea {...props} rows={4} value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} />
                    )}
                </Field>
            </Stack>
        </Modal>
    );
}

// 접수 취소(ADM-006)는 화면 정의서에 있지만 백엔드 API가 없어 요청을 보내지 않는다.
function CancelCaseModal({ open, onClose }) {
    const [reason, setReason] = useState('');
    return (
        <Modal
            open={open}
            title="사건 접수 취소"
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        닫기
                    </Button>
                    <Button variant="dangerOutline" disabled title="접수 취소 API 준비 전">
                        접수 취소
                    </Button>
                </>
            }
        >
            <p className={`${modalStyles.warn} body2`}>데이터는 삭제되지 않고 ‘취소’ 상태로 비활성 보관됩니다.</p>
            <Field label="취소 사유" required hint="예: 중복 접수">
                {(props) => <Textarea {...props} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}
            </Field>
            <Alert tone="warn" title="백엔드 API 준비 전">
                사건 접수 취소 API(예: POST /api/v1/cases/{'{caseId}'}/cancel)가 아직 없어 취소를 처리할 수 없습니다.
            </Alert>
        </Modal>
    );
}
