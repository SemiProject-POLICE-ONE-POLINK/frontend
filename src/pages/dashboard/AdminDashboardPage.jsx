import { useState } from 'react';
import { Link } from 'react-router';
import { getAdminDashboard } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import { CASE_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Tag from '../../components/common/Tag';
import { Button } from '../../components/common/Button';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import { BarList, KpiCard, KpiGrid } from '../../components/common/DataDisplay';
import { Columns } from '../../components/common/Layout';
import AssignOfficerModal from '../../components/case/AssignOfficerModal';

export default function AdminDashboardPage() {
    const { data, error, loading, reload } = useAsync(getAdminDashboard);
    const [assignTarget, setAssignTarget] = useState(null);
    const [notice, setNotice] = useState('');

    // 배정 요청은 사건 API(A)가 처리하고, 대시보드는 배정 후 갱신만 담당한다.
    const handleAssigned = (result) => {
        setAssignTarget(null);
        setNotice(`${result.caseId} 사건에 회원 번호 ${result.assignedOfficerId} 경찰을 배정했습니다. 사건·수사 상태가 ‘수사 중’으로 바뀌었습니다.`);
        reload();
    };

    const columns = [
        { key: 'caseId', header: '사건번호', mono: true, width: '140px' },
        {
            key: 'title',
            header: '사건명',
            render: (row) => (
                <Link to={`/admin/cases/${row.caseId}`}>
                    <b>{row.title}</b>
                </Link>
            ),
        },
        { key: 'caseType', header: '유형', render: (row) => <Tag>{labelOf(CASE_TYPE_LABEL, row.caseType)}</Tag> },
        { key: 'createdAt', header: '접수', mono: true, render: (row) => formatDateTime(row.createdAt).slice(5) },
        {
            key: 'assign',
            header: '',
            render: (row) => (
                <Button size="sm" onClick={() => setAssignTarget(row)}>
                    배정
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader eyebrow="관리자 콘솔" title="관할 사건 현황" description="미배정 사건에 담당 경찰을 지정하고, 사건 상태와 종결을 관리합니다." />
            {notice && <Alert tone="success">{notice}</Alert>}
            <ErrorState error={error} onRetry={reload} />
            {loading && !data && <LoadingState />}
            {data && (
                <>
                    <KpiGrid>
                        <KpiCard label="대기 중" value={data.waitingCaseCount} unit="건" hint="배정·검토 필요" />
                        <KpiCard label="수사 중" value={data.investigatingCaseCount} unit="건" />
                        {/* investigationDoneCaseCount는 백엔드 응답에 필드가 추가된 뒤에만 표시한다. */}
                        {typeof data.investigationDoneCaseCount === 'number' && (
                            <KpiCard label="종결 대기" value={data.investigationDoneCaseCount} unit="건" hint="관리자 종결 필요" />
                        )}
                        <KpiCard label="종결" value={data.closedCaseCount} unit="건" />
                        <KpiCard label="취소" value={data.canceledCaseCount} unit="건" hint="비활성 보관" />
                    </KpiGrid>
                    <Columns layout="main-side">
                        <Card title="담당 경찰 미배정 사건" subtitle={`${data.unassignedCaseCount}건`} padded={false}>
                            <DataTable
                                caption="담당 경찰 미배정 사건"
                                columns={columns}
                                rows={data.unassignedCases ?? []}
                                rowKey={(row) => row.caseId}
                                emptyText="미배정 사건이 없습니다."
                            />
                        </Card>
                        <Card title="유형별 사건">
                            <BarList
                                items={(data.caseTypeCounts ?? []).map((item) => ({
                                    key: item.caseType,
                                    label: labelOf(CASE_TYPE_LABEL, item.caseType),
                                    value: item.count,
                                }))}
                            />
                        </Card>
                    </Columns>
                </>
            )}
            <AssignOfficerModal
                open={Boolean(assignTarget)}
                caseId={assignTarget?.caseId}
                caseTitle={assignTarget?.title}
                currentOfficerId={null}
                onClose={() => setAssignTarget(null)}
                onAssigned={handleAssigned}
            />
        </>
    );
}
