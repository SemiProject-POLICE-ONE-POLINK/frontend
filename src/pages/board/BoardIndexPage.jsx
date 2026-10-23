import { useCallback } from 'react';
import { Navigate } from 'react-router';
import { getMyCases } from '../../api/cases';
import { useAsync } from '../../hooks/useAsync';
import { CASE_STATUS } from '../../constants/codes';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';

// 메뉴의 수사 보드는 배정 사건 중 수사 중인 사건(없으면 첫 사건)을 바로 연다.
export default function BoardIndexPage() {
    const loader = useCallback(() => getMyCases({ page: 0, size: 50 }), []);
    const { data, error, loading, reload } = useAsync(loader);

    if (loading && !data) {
        return <LoadingState />;
    }
    const items = data?.items ?? [];
    const target = items.find((item) => item.status === CASE_STATUS.INVESTIGATING) ?? items.find((item) => item.status !== CASE_STATUS.CANCELED);
    if (target) {
        return <Navigate to={`/board/${target.caseId}`} replace />;
    }
    return (
        <>
            <PageHeader title="수사 보드" />
            <ErrorState error={error} onRetry={reload} />
            {data && (
                <Card>
                    <EmptyState title="배정된 사건이 없습니다">관리자가 사건을 배정하면 이곳에서 수사를 진행할 수 있습니다.</EmptyState>
                </Card>
            )}
        </>
    );
}
