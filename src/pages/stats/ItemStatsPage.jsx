import { useCallback, useState } from 'react';
import { getItemStatistics } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import { useQueryState } from '../../hooks/useQueryState';
import { ITEM_CATEGORY_LABEL, ITEM_STATUS, ITEM_STATUS_LABEL } from '../../constants/codes';
import { formatDate, formatNumber, labelOf, todayDate } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { Select } from '../../components/common/Form';
import { BarList, ColumnChart, KpiCard, KpiGrid } from '../../components/common/DataDisplay';
import { Columns, Stack } from '../../components/common/Layout';

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

const DAILY_COLUMNS = [
    { key: 'date', header: '일자', mono: true, render: (row) => formatDate(row.date) },
    { key: 'count', header: '등록 건수', mono: true, align: 'right', render: (row) => formatNumber(row.count) },
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

export default function ItemStatsPage() {
    const { get, update } = useQueryState();
    const period = PERIODS.some((option) => option.value === get('period')) ? get('period') : '30';
    const [showTable, setShowTable] = useState(false);
    const loader = useCallback(() => getItemStatistics(rangeOf(period)), [period]);
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
                        <Card title="종류별 등록 건수" subtitle="분실물·습득물 합산">
                            <BarList
                                items={(data.categoryCounts ?? []).map((item) => ({
                                    key: item.category,
                                    label: labelOf(ITEM_CATEGORY_LABEL, item.category),
                                    value: item.count,
                                }))}
                                emptyText="0건"
                            />
                        </Card>
                        <Card title="처리 상태별 현황" padded={false}>
                            <DataTable caption="처리 상태별 현황" columns={statusColumns} rows={STATUS_ROWS} rowKey={(row) => row.status} />
                        </Card>
                    </Columns>
                    <Card
                        title="일별 등록 추이"
                        actions={
                            <Button size="sm" variant="secondary" aria-pressed={showTable} onClick={() => setShowTable((value) => !value)}>
                                {showTable ? '차트로 보기' : '표로 보기'}
                            </Button>
                        }
                    >
                        {showTable ? (
                            <DataTable caption="일별 등록 건수" columns={DAILY_COLUMNS} rows={data.dailyCounts ?? []} rowKey={(row) => row.date} emptyText="0건" />
                        ) : (
                            <ColumnChart
                                label="일별 물품 등록 건수"
                                items={(data.dailyCounts ?? []).map((item) => ({ key: item.date, label: formatDate(item.date), value: item.count }))}
                            />
                        )}
                    </Card>
                </Stack>
            )}
        </>
    );
}
