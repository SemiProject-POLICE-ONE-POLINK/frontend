import { useCallback, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getItemDetail, getMyItems } from '../../api/items';
import { getMyReturnRequests, getReturnRequests } from '../../api/returnRequests';
import { useAsync } from '../../hooks/useAsync';
import { useAuthStore } from '../../store/authStore';
import { ITEM_CATEGORY_LABEL, ITEM_STATUS, ITEM_STATUS_LABEL, ITEM_TYPE, RETURN_STATUS, RETURN_STATUS_LABEL, USER_ROLE } from '../../constants/codes';
import { formatDate, formatDateTime, labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Tag from '../../components/common/Tag';
import Icon from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import ItemFormModal from '../../components/items/ItemFormModal';
import ReturnRequestModal from '../../components/items/ReturnRequestModal';
import ImageAttachModal from '../../components/items/ImageAttachModal';
import styles from './Items.module.css';

const HISTORY_SIZE = 100;

// 반환 신청 이력: 시민은 본인 신청만, 경찰은 해당 물품 번호로 검색한 전체 신청(CIT-006 ⑤).
async function loadItem(itemId, role) {
    const item = await getItemDetail(itemId);
    if (role === USER_ROLE.CITIZEN) {
        const [myItems, myReturns] = await Promise.all([
            getMyItems({ page: 0, size: 50 }),
            getMyReturnRequests({ page: 0, size: HISTORY_SIZE }),
        ]);
        return {
            item,
            openLostItems: (myItems.items ?? []).filter((mine) => mine.itemType === ITEM_TYPE.LOST && mine.status === ITEM_STATUS.LOST),
            history: (myReturns.items ?? []).filter((request) => request.lostItemId === itemId || request.foundItemId === itemId),
        };
    }
    if (role === USER_ROLE.POLICE) {
        const returns = await getReturnRequests({ keyword: itemId, page: 0, size: HISTORY_SIZE });
        return {
            item,
            openLostItems: [],
            history: (returns.items ?? []).filter((request) => request.lostItemId === itemId || request.foundItemId === itemId),
        };
    }
    return { item, openLostItems: [], history: null };
}

export default function ItemDetailPage() {
    const { itemId } = useParams();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const role = user?.role;
    const loader = useCallback(() => loadItem(itemId, role), [itemId, role]);
    const { data, error, loading, reload } = useAsync(loader);
    const [modal, setModal] = useState(null);
    const [notice, setNotice] = useState(location.state?.created ? '등록을 완료했습니다. 등록자와 등록 일시가 기록되었습니다.' : '');

    const item = data?.item;
    const lost = item?.itemType === ITEM_TYPE.LOST;
    const mine = item?.registrantId === user?.userId;
    const fromMy = location.state?.from === 'my';

    // 화면의 버튼 노출은 서버 규칙을 반영한 보조 수단이다.
    const canEdit = item && ((lost && role === USER_ROLE.CITIZEN && mine && item.status === ITEM_STATUS.LOST) || (!lost && role === USER_ROLE.POLICE && item.status === ITEM_STATUS.STORED));
    const canAttachImage = item && role === USER_ROLE.CITIZEN && mine && lost && item.status === ITEM_STATUS.LOST && !item.imagePath;
    const foundRequestable = item && !lost && role === USER_ROLE.CITIZEN && !mine && item.status === ITEM_STATUS.STORED;
    const canRequest = foundRequestable && data.openLostItems.length > 0;
    const appliedLostIds = new Set(
        (data?.history ?? []).filter((request) => request.foundItemId === itemId && request.status !== RETURN_STATUS.REJECTED).map((request) => request.lostItemId)
    );

    const done = (message) => {
        setModal(null);
        setNotice(message);
        reload();
    };

    return (
        <>
            {fromMy ? (
                <Link className={`${styles.back} body2`} to="/my">
                    ← 마이페이지
                </Link>
            ) : (
                <Link className={`${styles.back} body2`} to={lost === false ? '/items?tab=FOUND' : '/items'}>
                    ← {lost === false ? '습득물' : '분실물'} 목록
                </Link>
            )}
            {notice && <Alert tone="success">{notice}</Alert>}
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {item && (
                <>
                    <PageHeader
                        eyebrow={`${item.itemId} · ${lost ? '분실물' : '습득물'}`}
                        title={item.itemName}
                        description={
                            <span className={styles.headLine}>
                                <StatusBadge code={item.status} labels={ITEM_STATUS_LABEL} />
                                <Tag>{labelOf(ITEM_CATEGORY_LABEL, item.category)}</Tag>
                            </span>
                        }
                        actions={
                            <>
                                {canRequest && <Button onClick={() => setModal('return')}>반환 신청</Button>}
                                {canEdit && (
                                    <Button variant="secondary" onClick={() => setModal('edit')}>
                                        수정
                                    </Button>
                                )}
                                {canAttachImage && (
                                    <Button variant="secondary" onClick={() => setModal('image')}>
                                        이미지 첨부
                                    </Button>
                                )}
                            </>
                        }
                    />
                    <div className={styles.layout}>
                        <Card>
                            <div className={styles.detail}>
                                {/* 이미지 공개 URL 계약이 확정되기 전에는 서버 경로를 img src로 쓰지 않는다. */}
                                <div className={`${styles.photo} caption1`}>
                                    <span>
                                        <Icon name={item.category} size={56} strokeWidth={1.4} />
                                        <br />
                                        {item.imagePath ? '첨부 이미지 있음' : '첨부 이미지 없음'}
                                    </span>
                                </div>
                                <dl className={`${styles.dl} body2`}>
                                    <dt>{lost ? '분실 물품' : '습득 물품'}</dt>
                                    <dd>{item.itemName}</dd>
                                    <dt>{lost ? '분실일자' : '습득일자'}</dt>
                                    <dd className="num">{formatDate(item.occurredAt)}</dd>
                                    <dt>장소</dt>
                                    <dd>{item.location}</dd>
                                    <dt>특징</dt>
                                    <dd>{item.description}</dd>
                                    <dt>등록자</dt>
                                    <dd>{mine ? `${user.name} (본인)` : `회원 번호 ${item.registrantId}`}</dd>
                                    <dt>등록일시</dt>
                                    <dd className="num">{formatDateTime(item.createdAt)}</dd>
                                    {item.returnedAt && (
                                        <>
                                            <dt>반환일시</dt>
                                            <dd className="num">{formatDateTime(item.returnedAt)}</dd>
                                        </>
                                    )}
                                </dl>
                            </div>
                        </Card>
                        <Card title={role === USER_ROLE.CITIZEN ? '내 반환 신청 이력' : '반환 신청 이력'}>
                            {data.history === null ? (
                                <p className={`${styles.muted} body2`}>관리자용 반환 신청 조회 API가 아직 없습니다. 반환 신청 처리는 경찰 계정에서 확인합니다.</p>
                            ) : data.history.length === 0 ? (
                                <EmptyState title="반환 신청이 없습니다">{canRequest && '본인 분실물과 일치하면 반환을 신청하세요.'}</EmptyState>
                            ) : (
                                <ul className={styles.history}>
                                    {data.history.map((request) => (
                                        <li key={request.requestId} className={styles.historyRow}>
                                            <span className={`${styles.code} num caption2`}>RT-{String(request.requestId).padStart(3, '0')}</span>
                                            <div>
                                                <StatusBadge code={request.status} labels={RETURN_STATUS_LABEL} />
                                                <p className={`${styles.muted} caption1`}>
                                                    <span className="num">
                                                        {request.lostItemId} ↔ {request.foundItemId}
                                                    </span>{' '}
                                                    · <span className="num">{formatDateTime(request.createdAt)}</span>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {item.status === ITEM_STATUS.HANDOVER_PENDING && (
                                <p className={`${styles.note} caption1`}>
                                    반환이 승인되어 인계 대기 중입니다. 경찰이 실제 물품을 건네면 반환 완료로 바뀝니다.
                                </p>
                            )}
                            {foundRequestable && data.openLostItems.length === 0 && (
                                <p className={`${styles.note} caption1`}>반환 신청은 본인이 등록한 미해결 분실물이 있을 때만 가능합니다.</p>
                            )}
                        </Card>
                    </div>

                    {modal === 'edit' && (
                        <ItemFormModal open itemType={item.itemType} item={item} onClose={() => setModal(null)} onSaved={() => done('수정 내용을 저장했습니다.')} />
                    )}
                    {modal === 'image' && <ImageAttachModal open itemId={item.itemId} onClose={() => setModal(null)} onSaved={() => done('이미지를 첨부했습니다.')} />}
                    {modal === 'return' && (
                        <ReturnRequestModal
                            open
                            foundItem={item}
                            lostItems={data.openLostItems}
                            appliedLostIds={appliedLostIds}
                            onClose={() => setModal(null)}
                            onSaved={() => done('반환을 신청했습니다. 경찰 확인 후 처리됩니다.')}
                        />
                    )}
                </>
            )}
        </>
    );
}
