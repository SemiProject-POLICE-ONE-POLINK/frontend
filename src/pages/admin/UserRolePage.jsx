import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import Icon from '../../components/common/Icon';
import { Alert } from '../../components/common/Feedback';
import { Stack } from '../../components/common/Layout';
import styles from '../case/CasePage.module.css';

const COLUMNS = [
    { key: 'userName', header: '아이디' },
    { key: 'name', header: '이름' },
    { key: 'role', header: '권한' },
    { key: 'phone', header: '연락처' },
];

// 사용자 권한(ADM-007)은 조회 전용 화면이다. 사용자 목록 API가 확정되지 않아
// mock 데이터로 연동 완료 처리하지 않고 표 구조와 필요한 계약만 보여 준다.
export default function UserRolePage() {
    return (
        <>
            <PageHeader eyebrow="관리자" title="사용자 권한" description="권한은 시민·경찰·관리자로 구분하며 DB에서 사전에 지정합니다." />
            <Stack gap={16}>
                <p className={`${styles.lockNote} body2`}>
                    <Icon name="users" size={16} />
                    이 화면은 조회 전용입니다. 서비스 안에서는 권한을 등록·수정·삭제할 수 없으며, 메뉴와 기능 접근은 DB에 설정된 권한에 따라 제한됩니다.
                </p>
                <Alert tone="warn" title="백엔드 API 준비 전">
                    회원 목록 조회 API(예: GET /api/v1/users, 관리자 전용)가 아직 없어 목록을 표시하지 않습니다. 계약이 확정되면 아이디·이름·권한·연락처를 연동합니다.
                </Alert>
                <Card padded={false}>
                    <DataTable caption="사용자 목록" columns={COLUMNS} rows={[]} rowKey={(row) => row.userName} emptyText="사용자 목록 API 연동 전입니다." />
                </Card>
            </Stack>
        </>
    );
}
