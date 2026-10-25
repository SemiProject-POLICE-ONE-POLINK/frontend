import { getAllUsers } from '../../api/users';
import { useAsync } from '../../hooks/useAsync';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Icon from '../../components/common/Icon';
import { ErrorState, LoadingState } from '../../components/common/Feedback';
import { Stack } from '../../components/common/Layout';
import styles from '../case/CasePage.module.css';

const ROLE_LABEL = {
    CITIZEN: '시민',
    POLICE: '경찰',
    ADMIN: '관리자',
};

const COLUMNS = [
    { key: 'userName', header: '아이디' },
    { key: 'name', header: '이름' },
    { key: 'role', header: '권한', render: (row) => ROLE_LABEL[row.role] ?? row.role },
    { key: 'phone', header: '연락처' },
];

export default function UserRolePage() {
    const { data, error, loading, reload } = useAsync(getAllUsers);
    const users = data?.users ?? [];

    return (
        <>
            <PageHeader eyebrow="관리자" title="사용자 권한" description="권한은 시민·경찰·관리자로 구분하며 DB에서 사전에 지정합니다." />
            <Stack gap={16}>
                <p className={`${styles.lockNote} body2`}>
                    <Icon name="users" size={16} />
                    이 화면은 조회 전용입니다. 서비스 안에서는 권한을 등록·수정·삭제할 수 없으며, 메뉴와 기능 접근은 DB에 설정된 권한에 따라 제한됩니다.
                </p>
                <ErrorState error={error} onRetry={reload} />

                {loading && !data && <LoadingState text="회원 목록을 불러오는 중입니다…" />}

                {data && (
                    <Card padded={false}>
                        <DataTable
                            caption="사용자 목록"
                            columns={COLUMNS}
                            rows={users}
                            rowKey={(row) => row.userId}
                            emptyText="등록된 회원이 없습니다."
                        />
                    </Card>
                )}
            </Stack>
        </>
    );
}
