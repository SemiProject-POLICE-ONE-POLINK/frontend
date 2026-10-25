import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { getItems } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import { useQueryState } from '../../hooks/useQueryState';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_PAGE_SIZE, ITEM_CATEGORY_LABEL, ITEM_STATUS, ITEM_STATUS_LABEL, ITEM_TYPE, USER_ROLE } from '../../constants/codes';
import { formatDate, labelOf } from '../../utils/format';
import { toServerPage } from '../../utils/query';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Tag from '../../components/common/Tag';
import { Button } from '../../components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import { Input, Select } from '../../components/common/Form';
import ItemFormModal from '../../components/items/ItemFormModal';
import ItemImage from '../../components/items/ItemImage';
import styles from './Items.module.css';

// 탭별 상태 필터 선택지(CIT-005 ⑥)
const STATUS_OPTIONS = {
    [ITEM_TYPE.LOST]: [ITEM_STATUS.LOST, ITEM_STATUS.HANDOVER_PENDING, ITEM_STATUS.RETURNED],
    [ITEM_TYPE.FOUND]: [ITEM_STATUS.STORED, ITEM_STATUS.HANDOVER_PENDING, ITEM_STATUS.RETURNED],
};

const loadCounts = () =>
    Promise.all([getItems({ itemType: ITEM_TYPE.LOST, page: 0, size: 1 }), getItems({ itemType: ITEM_TYPE.FOUND, page: 0, size: 1 })]).then(
        ([lost, found]) => ({ [ITEM_TYPE.LOST]: lost.totalElements, [ITEM_TYPE.FOUND]: found.totalElements })
    );

export default function ItemListPage() {
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.user?.role);
    const isCitizen = role === USER_ROLE.CITIZEN;
    const { get, update, page, setPage } = useQueryState();
    const tab = get('tab') === ITEM_TYPE.FOUND ? ITEM_TYPE.FOUND : ITEM_TYPE.LOST;
    const keyword = get('q');
    const category = get('category');
    const date = get('date');
    const status = STATUS_OPTIONS[tab].includes(get('status')) ? get('status') : '';
    const [keywordInput, setKeywordInput] = useState(keyword);
    const isComposing = useRef(false);

    useEffect(() => {
        if (!isComposing.current) {
            setKeywordInput(keyword);
        }
    }, [keyword]);
    // 마이페이지 빠른 실행에서 ?register=LOST|FOUND로 들어오면 등록 팝업을 연다.
    const registerParam = get('register');
    const [registerType, setRegisterType] = useState(isCitizen && ITEM_TYPE[registerParam] ? registerParam : null);

    
    const counts = useAsync(loadCounts);
    const loader = useCallback(
        () =>
            getItems({
                itemType: tab,
                keyword: keyword.trim(),
                category,
                status,
                startDate: date,
                endDate: date,
                page: toServerPage(page),
                size: DEFAULT_PAGE_SIZE,
            }),
        [tab, keyword, category, status, date, page]
    );
    const { data, error, loading, reload } = useAsync(loader);
    const filtered = Boolean(keyword || category || status || date);

    const closeRegister = () => {
        setRegisterType(null);
        if (registerParam) {
            update({ register: '' }, { resetPage: false });
        }
    };

    const handleSaved = (result) => {
        closeRegister();
        navigate(`/items/${result.itemId}`, { state: { created: true } });
    };

    return (
        <>
            <PageHeader
                eyebrow="LOST & FOUND"
                title="분실물·습득물"
                description="분실물과 습득물을 함께 조회합니다. 습득물 상세 화면에서 본인 분실물과 맞는지 확인하고 반환을 신청할 수 있습니다."
                actions={
                    isCitizen && (
                        <>
                            <Button variant="secondary" onClick={() => setRegisterType(ITEM_TYPE.LOST)}>
                                분실물 등록
                            </Button>
                            <Button onClick={() => setRegisterType(ITEM_TYPE.FOUND)}>습득물 등록</Button>
                        </>
                    )
                }
            />
            <Card padded={false}>
                <div className={styles.tabs} role="tablist" aria-label="분실물·습득물 구분">
                    {[ITEM_TYPE.LOST, ITEM_TYPE.FOUND].map((type) => (
                        <button
                            key={type}
                            type="button"
                            role="tab"
                            aria-selected={tab === type}
                            className={`${styles.tab} label`}
                            onClick={() => update({ tab: type === ITEM_TYPE.LOST ? '' : type, status: '' })}
                        >
                            {type === ITEM_TYPE.LOST ? '분실물' : '습득물'}
                            <span className={`${styles.tabCount} num caption1`}>{counts.data?.[type] ?? ''}</span>
                        </button>
                    ))}
                </div>
                <div className={styles.filters} role="search">
                    <Input
                        className={styles.grow}
                        type="search"
                        aria-label="물품 검색어"
                        placeholder="물품명, 특징으로 검색"
                        value={keywordInput}
                        onCompositionStart={() => {
                            isComposing.current = true;
                        }}
                        onCompositionEnd={(event) => {
                            isComposing.current = false;
                            const nextKeyword = event.currentTarget.value;
                            setKeywordInput(nextKeyword);
                            update({ q: nextKeyword });
                        }}
                        onChange={(event) => {
                            const nextKeyword = event.target.value;
                            setKeywordInput(nextKeyword);
                            if (!isComposing.current) {
                                update({ q: nextKeyword });
                            }
                        }}
                    />
                    <Select aria-label="종류" value={category} onChange={(event) => update({ category: event.target.value })}>
                        <option value="">종류 전체</option>
                        {Object.entries(ITEM_CATEGORY_LABEL).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    <Input
                        type="date"
                        aria-label={tab === ITEM_TYPE.LOST ? '분실일자' : '습득일자'}
                        value={date}
                        onChange={(event) => update({ date: event.target.value })}
                    />
                    <Select aria-label="상태" value={status} onChange={(event) => update({ status: event.target.value })}>
                        <option value="">상태 전체</option>
                        {STATUS_OPTIONS[tab].map((code) => (
                            <option key={code} value={code}>
                                {ITEM_STATUS_LABEL[code]}
                            </option>
                        ))}
                    </Select>
                    {filtered && (
                        <button
                            type="button"
                            className={`${styles.reset} caption2`}
                            onClick={() => {
                                setKeywordInput('');
                                update({ q: '', category: '', date: '', status: '' });
                            }}
                        >
                            조건 초기화
                        </button>
                    )}
                </div>
                <ErrorState error={error} onRetry={reload} />
                {loading && !data && <LoadingState />}
                {data && data.items.length === 0 && (
                    <EmptyState title={filtered ? '검색 결과가 없습니다' : '등록된 물품이 없습니다'}>{filtered && '조건을 바꿔 다시 찾아보세요.'}</EmptyState>
                )}
                {data && data.items.length > 0 && (
                    <ul className={styles.grid}>
                        {data.items.map((item) => (
                            <li key={item.itemId}>
                                <Link to={`/items/${item.itemId}`} className={styles.card}>
                                    <span className={`${styles.thumb} caption1`} aria-label={`${item.itemName} 이미지`}>
                                        <ItemImage itemId={item.itemId} alt={`${item.itemName} 이미지`} />
                                    </span>
                                    <span className={styles.cardBody}>
                                        <span className={styles.cardRow}>
                                            <span className={`${styles.code} num caption2`}>{item.itemId}</span>
                                            <Tag>{labelOf(ITEM_CATEGORY_LABEL, item.category)}</Tag>
                                        </span>
                                        <span className="label">{item.itemName}</span>
                                        <span className={`${styles.muted} caption1`}>{item.location}</span>
                                        <span className={styles.cardRow}>
                                            <span className={`${styles.muted} num caption1`}>{formatDate(item.occurredAt)}</span>
                                            <StatusBadge code={item.status} labels={ITEM_STATUS_LABEL} />
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                <div className={styles.pager}>
                    <Pagination page={page} totalPages={data?.totalPages} onPageChange={setPage} />
                </div>
            </Card>
            {registerType && <ItemFormModal open itemType={registerType} onClose={closeRegister} onSaved={handleSaved} />}
        </>
    );
}
