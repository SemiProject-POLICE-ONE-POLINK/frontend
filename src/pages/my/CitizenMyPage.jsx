import { Link, useNavigate } from 'react-router';
import { getCitizenMyPage, getMyInfo } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import { useChatStore } from '../../store/chatStore';
import {
    CASE_STATUS,
    CASE_STATUS_LABEL,
    CASE_TYPE_LABEL,
    ITEM_STATUS,
    ITEM_STATUS_LABEL,
    ITEM_TYPE,
    RETURN_STATUS,
    USER_ROLE_LABEL,
} from '../../constants/codes';
import { formatDate, labelOf } from '../../utils/format';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
import { ButtonLink } from '../../components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import CaseProgress from '../../components/case/CaseProgress';
import styles from './CitizenMyPage.module.css';

const loadMyPage = () => Promise.all([getCitizenMyPage(), getMyInfo()]).then(([page, info]) => ({ page, info }));

// 종결·취소 전이면 진행 중인 사건으로 센다.
const ACTIVE_CASE_STATUSES = [CASE_STATUS.WAITING, CASE_STATUS.INVESTIGATING, CASE_STATUS.INVESTIGATION_DONE];

function caseInfoText(item) {
    switch (item.status) {
        case CASE_STATUS.CANCELED:
            return (
                <>
                    <b>접수 취소</b> — {item.cancelReason || '사유 없음'}
                </>
            );
        case CASE_STATUS.CLOSED:
            return (
                <>
                    <b>종결</b> — 사건 처리가 끝났습니다. <span className="num">({formatDate(item.closedAt)})</span>
                </>
            );
        case CASE_STATUS.INVESTIGATING:
            return '담당 경찰이 배정되어 수사가 진행 중입니다. 상세 수사 기록은 담당 경찰과 관리자만 열람할 수 있습니다.';
        case CASE_STATUS.INVESTIGATION_DONE:
            return (
                <>
                    <b>종결 대기</b> — 담당 경찰의 수사가 끝났습니다. 관리자가 확인한 뒤 사건을 종결합니다.
                </>
            );
        default:
            return '담당 경찰을 배정하고 있습니다. 배정되면 수사가 시작됩니다.';
    }
}

function ReturnFlow({ status }) {
    if (!status) {
        return null;
    }
    const checked = status === RETURN_STATUS.APPROVED || status === RETURN_STATUS.COMPLETED || status === RETURN_STATUS.REJECTED;
    return (
        <div className={styles.flow} aria-label="반환 신청 단계">
            <span className={`${styles.on} caption2`}>반환 신청</span>
            <span className={`${checked ? styles.on : ''} caption2`}>{status === RETURN_STATUS.REJECTED ? '반려' : '경찰 확인'}</span>
            <span className={`${status === RETURN_STATUS.COMPLETED ? styles.ok : ''} caption2`}>인계 완료</span>
        </div>
    );
}

export default function CitizenMyPage() {
    const navigate = useNavigate();
    const openChat = useChatStore((state) => state.setOpen);
    
    const { data, error, loading, reload } = useAsync(loadMyPage);

    if (loading && !data) {
        return <LoadingState />;
    }
    if (!data) {
        return <ErrorState error={error} onRetry={reload} />;
    }

    const { page, info } = data;
    const activeCases = page.cases.filter((item) => ACTIVE_CASE_STATUSES.includes(item.status)).length;
    const lostCount = page.items.filter((item) => item.itemStatus === ITEM_STATUS.LOST).length;

    const quickActions = [
        { key: 'case', label: '사건 접수', desc: '피해 사실 신고', icon: 'report', to: '/cases/new', primary: true },
        { key: 'lost', label: '분실물 등록', desc: '잃어버린 물건 등록', icon: 'search', to: '/items?register=LOST' },
        { key: 'found', label: '습득물 등록', desc: '주운 물건 등록', icon: 'items', to: '/items?register=FOUND' },
        { key: 'ai', label: 'AI 유사 사건 찾기', desc: '대응 방법 안내', icon: 'ai', to: '/cases/ai-search', ai: true },
        { key: 'chat', label: 'AI 분실물 챗봇', desc: '설명으로 습득물 찾기', icon: 'chat', ai: true },
    ];

    return (
        <>
            <ErrorState error={error} onRetry={reload} />
            <section className={styles.hero}>
                <div>
                    <p className={`${styles.eyebrow} eyebrow`}>마이페이지</p>
                    <h1 className="display">{info.name} 님, 안녕하세요</h1>
                    <p className={`${styles.summary} body1`}>
                        진행 중인 사건 <b>{activeCases}건</b>, 분실 중인 물건 <b>{lostCount}건</b>이 있습니다.
                    </p>
                </div>
                <dl className={`${styles.me} caption1`}>
                    <div>
                        <dt>아이디</dt>
                        <dd className="num">{info.userName}</dd>
                    </div>
                    <div>
                        <dt>연락처</dt>
                        <dd className="num">{info.phone}</dd>
                    </div>
                    <div>
                        <dt>권한</dt>
                        <dd>{USER_ROLE_LABEL[info.role]}</dd>
                    </div>
                </dl>
            </section>

            <nav className={styles.quick} aria-label="빠른 실행">
                {quickActions.map((action) => {
                    const className = `${styles.qa} ${action.primary ? styles.qaPrimary : ''} ${action.ai ? styles.qaAi : ''}`;
                    const content = (
                        <>
                            <span className={styles.qaIcon}>
                                <Icon name={action.icon} size={22} />
                            </span>
                            <span>
                                <span className={`${styles.qaTitle} title3`}>{action.label}</span>
                                <span className={`${styles.qaDesc} caption1`}>{action.desc}</span>
                            </span>
                        </>
                    );
                    return action.to ? (
                        <Link key={action.key} to={action.to} className={className}>
                            {content}
                        </Link>
                    ) : (
                        <button key={action.key} type="button" className={className} onClick={() => openChat(true)}>
                            {content}
                        </button>
                    );
                })}
            </nav>

            <div className={styles.grid}>
                <Card
                    title="내가 접수한 사건"
                    subtitle={`${page.totalCaseCount}건 · 진행 단계`}
                    padded={false}
                    actions={
                        <ButtonLink size="sm" variant="secondary" to="/cases">
                            전체 사건 목록
                        </ButtonLink>
                    }
                >
                    {page.cases.length === 0 ? (
                        <EmptyState title="접수한 사건이 없습니다">위의 “사건 접수”로 피해 사실을 접수할 수 있습니다.</EmptyState>
                    ) : (
                        page.cases.map((item) => (
                            <article key={item.caseId} className={styles.case}>
                                <div className={styles.caseHead}>
                                    <span className="num caption1">{item.caseId}</span>
                                    <span className={`${styles.tag} caption2`}>{labelOf(CASE_TYPE_LABEL, item.caseType)}</span>
                                    <StatusBadge code={item.status} labels={CASE_STATUS_LABEL} />
                                    <Link className={`${styles.more} label`} to={`/cases/${item.caseId}`}>
                                        상세 보기 ›
                                    </Link>
                                </div>
                                <h3 className="title3">{item.title}</h3>
                                <p className={`${styles.muted} caption1`}>
                                    <span className="num">{formatDate(item.createdAt)}</span> 접수 · {item.location}
                                </p>
                                <div className={styles.progress}>
                                    <CaseProgress status={item.status} receivedAt={item.createdAt} closedAt={item.closedAt} />
                                </div>
                                <p className={`${styles.info} body2`}>{caseInfoText(item)}</p>
                            </article>
                        ))
                    )}
                </Card>

                <Card
                    title="내 분실물·습득물"
                    subtitle={`${page.totalItemCount}건`}
                    padded={false}
                    actions={
                        <ButtonLink size="sm" variant="secondary" to="/items">
                            목록
                        </ButtonLink>
                    }
                >
                    {page.items.length === 0 ? (
                        <EmptyState title="등록한 물품이 없습니다" />
                    ) : (
                        <ul>
                            {page.items.map((item) => (
                                <li key={item.itemId}>
                                    <button
                                        type="button"
                                        className={styles.item}
                                        onClick={() => navigate(`/items/${item.itemId}`, { state: { from: 'my' } })}
                                    >
                                        <span className={styles.thumb}>
                                            <Icon name={item.itemType === ITEM_TYPE.LOST ? 'search' : 'items'} size={22} />
                                        </span>
                                        <span className={styles.itemBody}>
                                            <span className={`${styles.itemTitle} label`}>
                                                {item.itemName}
                                                <span className={`${styles.tag} caption2`}>{item.itemType === ITEM_TYPE.LOST ? '분실' : '습득'}</span>
                                                <StatusBadge code={item.itemStatus} labels={ITEM_STATUS_LABEL} />
                                            </span>
                                            <span className={`${styles.muted} caption1`}>
                                                {item.location} · <span className="num">{formatDate(item.occurredAt)}</span>
                                            </span>
                                            <ReturnFlow status={item.returnStatus} />
                                        </span>
                                        <span className={styles.go} aria-hidden="true">
                                            ›
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </>
    );
}
