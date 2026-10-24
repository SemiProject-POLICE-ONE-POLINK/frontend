import { useNavigate } from 'react-router';
import { getPoliceDashboard } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import { CASE_STATUS, CASE_STATUS_LABEL, CASE_TYPE_LABEL } from '../../constants/codes';
import { labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Tag from '../../components/common/Tag';
import Icon from '../../components/common/Icon';
import { ButtonLink } from '../../components/common/Button';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { KpiCard, KpiGrid } from '../../components/common/DataDisplay';

// 사건 상세(A)와 수사 보드(B)는 같은 caseId 원문을 사용한다.
const COLUMNS = [
    { key: 'caseId', header: '사건번호', mono: true, width: '150px' },
    { key: 'title', header: '사건명', render: (row) => <b>{row.title}</b> },
    { key: 'caseType', header: '유형', render: (row) => <Tag>{labelOf(CASE_TYPE_LABEL, row.caseType)}</Tag> },
    { key: 'status', header: '상태', render: (row) => <StatusBadge code={row.status} labels={CASE_STATUS_LABEL} /> },
    {
        key: 'board',
        header: '수사 보드',
        width: '160px',
        render: (row) => <BoardLink row={row} />,
    },
];

// 수사 중인 사건만 수사를 이어 가고, 종결 대기·종결 사건은 수사 보드에서 기록을 조회만 한다(POL-002).
// 행 클릭은 사건 상세로 가므로, 버튼 클릭이 행까지 올라가 상세로 다시 이동하지 않게 막는다.
function BoardLink({ row }) {
    const investigating = row.status === CASE_STATUS.INVESTIGATING;
    const label = investigating ? '수사 보드 열기' : '기록 보기';
    return (
        <ButtonLink
            size="sm"
            variant={investigating ? 'primary' : 'secondary'}
            to={`/board/${row.caseId}`}
            onClick={(event) => event.stopPropagation()}
            aria-label={`${row.caseId} ${label}`}
        >
            <Icon name="board" size={14} /> {label}
        </ButtonLink>
    );
}

export default function PoliceDashboardPage() {
    const navigate = useNavigate();
    const { data, error, loading, reload } = useAsync(getPoliceDashboard);

    return (
        <>
            <PageHeader
                title={data ? `${data.officerName}님의 근무 현황` : '경찰 대시보드'}
                description="배정된 사건과 반환 신청을 확인하세요."
            />
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {data && (
                <>
                    <KpiGrid>
                        <KpiCard label="배정 사건 (진행)" value={data.investigatingCaseCount} unit="건" hint={`누적 ${data.totalAssignedCaseCount}건`} />
                        <KpiCard label="반환 신청 대기" value={data.pendingReturnRequestCount} unit="건" hint="소유 여부 확인 필요" to="/returns?status=PENDING" />
                        <KpiCard label="보관 중 습득물" value={data.storedFoundItemCount} unit="건" to="/items?tab=FOUND&status=STORED" />
                    </KpiGrid>
                    <Card title="내 배정 사건" padded={false}>
                        <DataTable
                            caption="내 배정 사건"
                            columns={COLUMNS}
                            rows={data.assignedCases ?? []}
                            rowKey={(row) => row.caseId}
                            onRowClick={(row) => navigate(`/cases/${row.caseId}`)}
                            rowLabel={(row) => `${row.caseId} ${row.title} 상세 보기`}
                            emptyText="배정된 사건이 없습니다."
                        />
                    </Card>
                </>
            )}
        </>
    );
}
