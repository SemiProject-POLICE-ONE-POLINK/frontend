import { useCallback } from 'react';
import { getItemStatistics, getItems } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import { useQueryState } from '../../hooks/useQueryState';
import { ITEM_CATEGORY_LABEL, ITEM_STATUS, ITEM_STATUS_LABEL, ITEM_TYPE } from '../../constants/codes';
import { formatNumber, labelOf, todayDate } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { Select } from '../../components/common/Form';
import { BarList, KpiCard, KpiGrid } from '../../components/common/DataDisplay';
import { Columns, Stack } from '../../components/common/Layout';
import styles from './ItemStatsPage.module.css';

const PERIODS = [
    { value: '7', label: '최근 7일' },
    { value: '30', label: '최근 30일' },
    { value: '90', label: '최근 90일' },
    { value: 'all', label: '전체 기간' },
];

// 상태별 현황의 구분 열. 인계 대기·반환 완료는 서버가 분실물·습득물을 합산해 준다.
const STATUS_ROWS = [
    { status: ITEM_STATUS.LOST, group: '분실물' },
    { status: ITEM_STATUS.STORED, group: '습득물' },
    { status: ITEM_STATUS.HANDOVER_PENDING, group: '분실물·습득물' },
    { status: ITEM_STATUS.RETURNED, group: '분실물·습득물' },
];

function rangeOf(period) {
    if (period === 'all') {
        return { startDate: '', endDate: '' };
    }
    const start = new Date();
    start.setDate(start.getDate() - (Number(period) - 1));
    const pad = (value) => String(value).padStart(2, '0');
    return { startDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`, endDate: todayDate() };
}

async function loadStatistics(period) {
    const range = rangeOf(period);
    const statistics = await getItemStatistics(range);
    const categories = (statistics.categoryCounts ?? []).map((item) => item.category);
    const countResponses = await Promise.all(
        categories.flatMap((category) =>
            [ITEM_TYPE.LOST, ITEM_TYPE.FOUND].map(async (itemType) => {
                const response = await getItems({ itemType, category, startDate: range.startDate, endDate: range.endDate, page: 0, size: 1 });
                return { category, itemType, count: response.totalElements ?? 0 };
            })
        )
    );
    const categoryTypeCounts = categories.map((category) => ({
        category,
        lost: countResponses.find((item) => item.category === category && item.itemType === ITEM_TYPE.LOST)?.count ?? 0,
        found: countResponses.find((item) => item.category === category && item.itemType === ITEM_TYPE.FOUND)?.count ?? 0,
    }));
    return { ...statistics, categoryTypeCounts };
}

function CategoryTypeBars({ items }) {
    const maxCount = Math.max(...items.flatMap((item) => [item.lost, item.found]), 1);
    return (
        <>
            <p className={styles.legend} aria-label="그래프 범례">
                <span><i className={styles.lostMark} />분실물</span>
                <span><i className={styles.foundMark} />습득물</span>
            </p>
            <ul className={styles.dualBars}>
                {items.map((item) => (
                    <li key={item.category} className={styles.dualBarRow}>
                        <span className={`${styles.categoryLabel} body2`}>{labelOf(ITEM_CATEGORY_LABEL, item.category)}</span>
                        <span className={styles.barPair} aria-label={`${labelOf(ITEM_CATEGORY_LABEL, item.category)}: 분실물 ${item.lost}건, 습득물 ${item.found}건`}>
                            <span className={styles.barTrack}><span className={styles.lostBar} style={{ width: `${(item.lost / maxCount) * 100}%` }} /></span>
                            <span className={styles.barTrack}><span className={styles.foundBar} style={{ width: `${(item.found / maxCount) * 100}%` }} /></span>
                        </span>
                        <span className={`${styles.barCount} body2 num`}>{item.lost}/{item.found}</span>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default function ItemStatsPage() {
    const { get, update } = useQueryState();
    const period = PERIODS.some((option) => option.value === get('period')) ? get('period') : '30';
    const loader = useCallback(() => loadStatistics(period), [period]);
    const { data, error, loading, reload } = useAsync(loader);

    const statusColumns = [
        { key: 'group', header: '구분' },
        { key: 'status', header: '상태', render: (row) => <StatusBadge code={row.status} labels={ITEM_STATUS_LABEL} /> },
        { key: 'count', header: '건수', mono: true, align: 'right', render: (row) => formatNumber(data?.statusCounts?.[row.status] ?? 0) },
    ];

    return (
        <>
            <PageHeader
                eyebrow="분석"
                title="분실물 통계"
                description="기간별 분실·습득 등록 건수와 처리 현황입니다. 데이터가 없는 항목은 0건으로 표시됩니다."
                actions={
                    <Select aria-label="조회 기간" value={period} onChange={(event) => update({ period: event.target.value })}>
                        {PERIODS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                }
            />
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {data && (
                <Stack gap={16}>
                    <KpiGrid>
                        <KpiCard label="분실물 등록" value={data.lostCount} unit="건" />
                        <KpiCard label="습득물 등록" value={data.foundCount} unit="건" />
                        <KpiCard label="반환 완료" value={data.returnedCount} unit="건" hint="분실·습득 합산" />
                        <KpiCard label="인계 대기" value={data.handoverPendingCount} unit="건" hint="반환 승인 후 인계 전" />
                    </KpiGrid>
                    <Columns>
                        <Card title="종류별 등록 건수">
                            {(data.categoryTypeCounts ?? []).length > 0 ? <CategoryTypeBars items={data.categoryTypeCounts} /> : <BarList items={[]} emptyText="0건" />}
                        </Card>
                        <Card title="처리 상태별 현황" padded={false}>
                            <DataTable caption="처리 상태별 현황" columns={statusColumns} rows={STATUS_ROWS} rowKey={(row) => row.status} />
                        </Card>
                    </Columns>
                </Stack>
            )}
        </>
    );
}
