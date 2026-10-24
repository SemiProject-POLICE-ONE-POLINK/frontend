import { useCallback, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router';
import { getMyCases } from '../../api/cases';
import { getInvestigationBoard, getInvestigationLogs } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { useAuthStore } from '../../store/authStore';
import { useAiRun } from '../../store/aiInferenceStore';
import { CASE_STATUS, CASE_STATUS_LABEL, CASE_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import Icon, { Emblem } from '../../components/common/Icon';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import { InvestigationCloseModal } from '../../components/board/BoardModals';
import styles from './Board.module.css';

const TABS = [
    { to: '', label: '수사 보드', end: true },
    { to: 'ai', label: 'AI 사건 추론', ai: true },
    { to: 'evidences', label: '증거물 관리' },
    { to: 'witnesses', label: '목격자 관리' },
    { to: 'logs', label: '수사 기록' },
    { to: 'hypotheses', label: '수사 가설' },
];

async function loadBoard(caseId) {
    const [board, logs, myCases] = await Promise.all([
        getInvestigationBoard(caseId),
        getInvestigationLogs(caseId),
        getMyCases({ page: 0, size: 50 }),
    ]);
    return { board, logs, myCases: myCases.items ?? [] };
}

// 수사 보드(POL-002) 공통 틀: 사건 헤더, 탭, 수사 종결 버튼. 각 탭은 자기 자료를 따로 조회한다.
export default function BoardLayout() {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const loader = useCallback(() => loadBoard(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);
    const [closeOpen, setCloseOpen] = useState(false);
    const [notice, setNotice] = useState('');
    // AI 추론 진행·새 결과 여부는 탭에 표시한다. 요청과 결과는 화면을 떠나도 이어지도록 스토어가 들고 있다.
    const ai = useAiRun(caseId);
    const aiUnseen = ai.run.status === 'done' && ai.run.unseen;

    const board = data?.board;
    const caseInfo = board?.caseInfo;
    // 수사 종결(종결 대기)·사건 종결된 수사는 조회만 가능하다. 서버도 수사 중이 아니면 등록을 409로 막는다.
    const invClosed = caseInfo?.status === CASE_STATUS.INVESTIGATION_DONE || caseInfo?.status === CASE_STATUS.CLOSED;
    const locked = !caseInfo || caseInfo.status !== CASE_STATUS.INVESTIGATING;
    const officerName = caseInfo?.assignedOfficerId === user?.userId ? user.name : `회원 번호 ${caseInfo?.assignedOfficerId ?? '-'}`;

    // 잠금은 다시 조회한 사건 상태로만 판단한다. 서버가 종결 대기로 바꾸지 않았으면 그 사실을 그대로 알린다.
    const handleClosed = (result) => {
        setCloseOpen(false);
        setNotice(
            result.status === CASE_STATUS.INVESTIGATION_DONE
                ? { tone: 'success', text: '수사를 종결했습니다. 사건이 종결 대기 상태가 되어 수사 보드는 조회만 가능합니다.' }
                : { tone: 'warn', text: '수사 종결 기록은 저장했지만 서버가 사건 상태를 종결 대기로 바꾸지 않았습니다. 백엔드 반영이 필요합니다.' }
        );
        reload();
    };

    if (loading && !data) {
        return <LoadingState />;
    }

    return (
        <>
            <ErrorState error={error} onRetry={reload} />
            {caseInfo && (
                <section className={styles.hero} aria-label="사건 헤더">
                    <span className={styles.heroDeco} aria-hidden="true">
                        <Emblem size={280} />
                    </span>
                    <div className={`${styles.crumb} caption1`}>
                        수사 관리 › 사건 수사 보드
                        {data.myCases.length > 1 && (
                            <>
                                {' · '}
                                <select
                                    className={`${styles.caseSelect} caption1`}
                                    aria-label="담당 사건 선택"
                                    value={caseId}
                                    onChange={(event) => navigate(`/board/${event.target.value}`)}
                                >
                                    {data.myCases.map((item) => (
                                        <option key={item.caseId} value={item.caseId}>
                                            {item.caseId} · {item.title}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                    <div className={styles.titleRow}>
                        <span className={`${styles.caseId} num`}>{caseInfo.caseId}</span>
                        <h1 className="title1">{caseInfo.title}</h1>
                        <span className={`${styles.live} caption2`}>{labelOf(CASE_STATUS_LABEL, caseInfo.status)}</span>
                    </div>
                    <dl className={`${styles.meta} body2`}>
                        <div>
                            <dt>발생 일시</dt>
                            <dd className="num">{formatDateTime(caseInfo.occurredAt)}</dd>
                        </div>
                        <div>
                            <dt>발생 장소</dt>
                            <dd>{caseInfo.location}</dd>
                        </div>
                        <div>
                            <dt>사건 유형</dt>
                            <dd>{labelOf(CASE_TYPE_LABEL, caseInfo.caseType)}</dd>
                        </div>
                        <div>
                            <dt>담당 형사</dt>
                            <dd>{officerName}</dd>
                        </div>
                    </dl>
                    <nav className={styles.tabs} aria-label="수사 보드 탭">
                        {TABS.map((tab) => {
                            const disabled = tab.ai && locked;
                            if (disabled) {
                                return (
                                    <span key={tab.label} className={`${styles.tab} ${styles.tabDisabled} label`} title="수사 종결된 사건은 AI 사건 추론을 사용할 수 없습니다">
                                        {tab.label}
                                        <span className={`${styles.aiDot} micro`}>AI</span>
                                    </span>
                                );
                            }
                            return (
                                <NavLink
                                    key={tab.label}
                                    to={tab.to ? `/board/${caseId}/${tab.to}` : `/board/${caseId}`}
                                    end={tab.end}
                                    className={({ isActive }) => `${styles.tab} label ${isActive ? styles.tabActive : ''}`}
                                >
                                    {tab.label}
                                    {tab.ai && <span className={`${styles.aiDot} micro`}>AI</span>}
                                    {tab.ai && ai.running && <span className={styles.tabSpin} role="img" aria-label="추론 중" />}
                                    {tab.ai && aiUnseen && <span className={`${styles.tabNew} micro`}>새 결과</span>}
                                </NavLink>
                            );
                        })}
                        <span className={styles.tabSep} aria-hidden="true" />
                        <button
                            type="button"
                            className={`${styles.closeButton} label`}
                            disabled={locked}
                            title={locked ? '이미 종결되었거나 수사 중이 아닌 사건입니다' : undefined}
                            onClick={() => setCloseOpen(true)}
                        >
                            <Icon name="check" size={15} strokeWidth={2.4} />
                            {invClosed ? '수사 종결됨' : '수사 종결'}
                        </button>
                    </nav>
                </section>
            )}
            {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
            {caseInfo && locked && (
                <Alert tone="info">
                    {caseInfo.status === CASE_STATUS.INVESTIGATION_DONE
                        ? '수사가 종결되어 관리자의 사건 종결을 기다리고 있습니다. 기록은 조회만 가능합니다.'
                        : '종결되었거나 수사 중이 아닌 사건입니다. 기록은 조회만 가능합니다.'}
                </Alert>
            )}
            {board && <Outlet context={{ caseId, board, logs: data.logs, locked, officerName, reloadBoard: reload }} />}
            {caseInfo && (
                <InvestigationCloseModal
                    open={closeOpen}
                    caseId={caseId}
                    onClose={() => setCloseOpen(false)}
                    onClosed={handleClosed}
                />
            )}
        </>
    );
}
