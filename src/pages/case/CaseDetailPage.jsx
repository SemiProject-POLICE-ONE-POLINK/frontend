import { useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { getCaseDetail } from '../../api/cases';
import { getCitizenMyPage } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import { useAuthStore } from '../../store/authStore';
import { CASE_STATUS, CASE_STATUS_LABEL, CASE_TYPE_LABEL, USER_ROLE } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
import { Button, ButtonLink } from '../../components/common/Button';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import { Stack } from '../../components/common/Layout';
import CaseProgress from '../../components/case/CaseProgress';
import styles from './CasePage.module.css';

// 상세 DTO에는 접수일시·종결일시·취소 사유가 없어서, 시민은 마이페이지의 내 사건 요약과 합쳐 보여 준다.
async function loadCase(caseId, isCitizen) {
    const detail = await getCaseDetail(caseId);
    if (!isCitizen) {
        return { detail, summary: null };
    }
    const myPage = await getCitizenMyPage();
    return { detail, summary: myPage.cases.find((item) => item.caseId === caseId) ?? null };
}

export default function CaseDetailPage() {
    const { caseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const isCitizen = user?.role === USER_ROLE.CITIZEN;
    const loader = useCallback(() => loadCase(caseId, isCitizen), [caseId, isCitizen]);
    const { data, error, loading, reload } = useAsync(loader);

    // 시민이 본인이 접수하지 않은 사건을 열면 서버가 403을 준다(CIT-001P).
    if (isCitizen && error?.status === 403) {
        return (
            <Modal open ariaLabel="상세 조회 제한" onClose={() => navigate('/cases')} footer={<Button onClick={() => navigate('/cases')}>확인</Button>}>
                <p className="body1">
                    <b>{caseId}</b>
                    <br />
                    시민은 본인이 접수한 사건만 상세 정보를 볼 수 있습니다.
                </p>
            </Modal>
        );
    }

    const detail = data?.detail;
    const summary = data?.summary;
    const isAssignedOfficer = user?.role === USER_ROLE.POLICE && detail?.assignedOfficerId === user.userId;

    return (
        <>
            <Link className={`${styles.back} body2`} to="/cases">
                ← 사건 목록
            </Link>
            {location.state?.created && <Alert tone="success">사건번호 {caseId}로 접수했습니다. 담당 경찰이 배정되면 수사가 시작됩니다.</Alert>}
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {detail && (
                <>
                    <PageHeader
                        eyebrow={`${detail.caseId} · ${labelOf(CASE_TYPE_LABEL, detail.caseType)}`}
                        title={detail.title}
                        description={
                            <span className={styles.headLine}>
                                사건 <StatusBadge code={detail.status} labels={CASE_STATUS_LABEL} />
                            </span>
                        }
                        actions={
                            isAssignedOfficer &&
                            (detail.status === CASE_STATUS.INVESTIGATING || detail.status === CASE_STATUS.INVESTIGATION_DONE) && (
                                <ButtonLink to={`/board/${caseId}`}>
                                    <Icon name="board" size={15} /> 수사 보드에서 열기
                                </ButtonLink>
                            )
                        }
                    />
                    <div className={styles.layout}>
                        <Stack gap={16}>
                            <Card title="사건 정보">
                                <dl className={`${styles.dl} body2`}>
                                    <dt>사건번호</dt>
                                    <dd className="num">{detail.caseId}</dd>
                                    <dt>발생일시</dt>
                                    <dd className="num">{formatDateTime(detail.occurredAt)}</dd>
                                    <dt>발생장소</dt>
                                    <dd>{detail.location}</dd>
                                    {summary && (
                                        <>
                                            <dt>신고인</dt>
                                            <dd>{user.name} (본인)</dd>
                                            <dt>접수일시</dt>
                                            <dd className="num">{formatDateTime(summary.createdAt)}</dd>
                                        </>
                                    )}
                                    <dt>신고내용</dt>
                                    <dd>{detail.description}</dd>
                                </dl>
                                {detail.status === CASE_STATUS.CLOSED && (
                                    <p className={`${styles.closeNote} body2`}>
                                        <b>종결</b> — 사건 처리가 끝났습니다.
                                        {summary?.closedAt && <span className="num"> ({formatDateTime(summary.closedAt)})</span>}
                                    </p>
                                )}
                                {detail.status === CASE_STATUS.CANCELED && (
                                    <p className={`${styles.cancelNote} body2`}>
                                        <b>접수 취소</b>
                                        {summary?.cancelReason && ` — ${summary.cancelReason}`}
                                        <br />
                                        데이터는 삭제되지 않고 비활성 상태로 보관됩니다.
                                    </p>
                                )}
                            </Card>
                            <Card title="진행 단계">
                                <CaseProgress status={detail.status} receivedAt={summary?.createdAt} closedAt={summary?.closedAt} />
                            </Card>
                            <Card title="수사 기록" subtitle="시간순">
                                <p className={`${styles.lockNote} body2`}>
                                    <Icon name="lock" size={14} />
                                    {isAssignedOfficer
                                        ? '상세 수사 기록은 수사 보드의 수사 기록 탭에서 확인합니다.'
                                        : '수사 진행 정보만 공개됩니다. 상세 수사 기록은 담당 경찰과 관리자만 열람할 수 있습니다.'}
                                </p>
                            </Card>
                        </Stack>
                        <Card title="담당 경찰" subtitle={detail.assignedOfficerId ? '1명' : '0명'}>
                            {detail.assignedOfficerId ? (
                                <div className={styles.officer}>
                                    <span className={`${styles.avatar} label`} aria-hidden="true">
                                        경
                                    </span>
                                    <div>
                                        <p className="label">{isAssignedOfficer ? `${user.name} (본인)` : '담당 경찰 배정됨'}</p>
                                        <p className={`${styles.muted} caption1`}>
                                            회원 번호 <span className="num">{detail.assignedOfficerId}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className={`${styles.muted} body2`}>미배정 — 관리자가 담당 경찰을 배정합니다.</p>
                            )}
                        </Card>
                    </div>
                </>
            )}
        </>
    );
}
