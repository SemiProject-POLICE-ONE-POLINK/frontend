import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getCases } from '../../api/cases';
import { useAsync } from '../../hooks/useAsync';
import { useQueryState } from '../../hooks/useQueryState';
import { useAuthStore } from '../../store/authStore';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, DEFAULT_PAGE_SIZE, USER_ROLE } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import { toServerPage } from '../../utils/query';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Tag from '../../components/common/Tag';
import Icon from '../../components/common/Icon';
import { ButtonLink } from '../../components/common/Button';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { Input, Select } from '../../components/common/Form';
import styles from './CasePage.module.css';

// 서버 검색 조건이 없어 검색어와 필터는 현재 조회한 페이지 안에서 적용한다.
const DESCRIPTION = {
    [USER_ROLE.CITIZEN]: '내가 접수한 사건의 사건명과 처리 진행을 확인합니다.',
    [USER_ROLE.POLICE]: '관할 내 모든 사건을 조회하고 상세 정보를 확인합니다.',
    [USER_ROLE.ADMIN]: '관할 내 모든 사건을 조회하고 배정·종결을 관리합니다.',
};

export default function CaseListPage() {
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.user?.role);
    const isCitizen = role === USER_ROLE.CITIZEN;
    const { get, update, page, setPage } = useQueryState();
    const keyword = get('q');
    const type = get('type');
    const status = isCitizen ? '' : get('status');

    const loader = useCallback(
        () =>
            getCases({
                page: toServerPage(page),
                size: DEFAULT_PAGE_SIZE,
                sort: 'createdAt,desc',
            }),
        [page]
    );

    const { data, error, loading, reload } = useAsync(loader);

    const normalized = keyword.trim().toLowerCase();
    const rows = (data?.items ?? []).filter(
        (row) =>
            (!normalized || [row.caseId, row.title, row.location].join(' ').toLowerCase().includes(normalized)) &&
            (!type || row.caseType === type) &&
            (!status || row.status === status)
    );
    const filtered = Boolean(keyword || type || status);

    // 시민 목록에는 상태 필터와 상태 항목을 표시하지 않는다(CIT-001).
    const columns = [
        { key: 'caseId', header: '사건번호', mono: true, width: '150px' },
        { key: 'title', header: '사건명', render: (row) => <b className={styles.title}>{row.title}</b> },
        { key: 'caseType', header: '유형', render: (row) => <Tag>{labelOf(CASE_TYPE_LABEL, row.caseType)}</Tag> },
        { key: 'occurredAt', header: '발생일시', mono: true, render: (row) => formatDateTime(row.occurredAt) },
        { key: 'location', header: '장소' },
        ...(isCitizen ? [] : [{ key: 'status', header: '상태', render: (row) => <StatusBadge code={row.status} labels={CASE_STATUS_LABEL} /> }]),
    ];

    const openCase = (row) => navigate(role === USER_ROLE.ADMIN ? `/admin/cases/${row.caseId}` : `/cases/${row.caseId}`);

    return (
        <>
            <PageHeader
                eyebrow="사건"
                title="사건 목록"
                description={DESCRIPTION[role]}
                actions={
                    isCitizen && (
                        <ButtonLink to="/cases/new">
                            <Icon name="report" size={15} /> 사건 접수
                        </ButtonLink>
                    )
                }
            />
            <Card padded={false}>
                <div className={styles.filters} role="search">
                    <Input
                        className={styles.grow}
                        type="search"
                        aria-label="사건 검색어"
                        placeholder="사건번호, 사건명, 장소로 검색"
                        value={keyword}
                        onChange={(event) => update({ q: event.target.value })}
                    />
                    <Select aria-label="사건 유형" value={type} onChange={(event) => update({ type: event.target.value })}>
                        <option value="">유형 전체</option>
                        {Object.entries(CASE_TYPE_LABEL).map(([code, label]) => (
                            <option key={code} value={code}>
                                {label}
                            </option>
                        ))}
                    </Select>
                    {!isCitizen && (
                        <Select aria-label="처리 상태" value={status} onChange={(event) => update({ status: event.target.value })}>
                            <option value="">상태 전체</option>
                            {Object.entries(CASE_STATUS_LABEL).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </Select>
                    )}
                    {filtered && (
                        <button type="button" className={`${styles.reset} caption2`} onClick={() => update({ q: '', type: '', status: '' })}>
                            조건 초기화
                        </button>
                    )}
                </div>
                <ErrorState error={error} onRetry={reload} />
                {loading && !data ? (
                    <LoadingState />
                ) : (
                    <DataTable
                        caption="사건 목록"
                        columns={columns}
                        rows={rows}
                        rowKey={(row) => row.caseId}
                        onRowClick={openCase}
                        rowLabel={(row) => `${row.caseId} ${row.title} 상세 보기`}
                        emptyText={filtered ? '검색 결과 없음 — 다른 검색어나 조건으로 다시 찾아보세요.' : '등록된 사건이 없습니다.'}
                    />
                )}
                {filtered && data?.totalPages > 1 && (
                    <p className={`${styles.limit} caption1`}>
                        검색어와 필터는 현재 페이지에 표시된 사건 안에서 적용됩니다.
                    </p>
                )}
                <div className={styles.pager}>
                    <Pagination
                        page={page}
                        totalPages={data?.totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </Card>
        </>
    );
}
