import { useLocation } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { homePathOf } from '../../config/nav';
import { USER_ROLE_LABEL } from '../../constants/codes';
import PageHeader from '../../components/common/PageHeader';
import { ButtonLink } from '../../components/common/Button';
import { EmptyState } from '../../components/common/Feedback';
import Card from '../../components/common/Card';

export default function ForbiddenPage() {
    const role = useAuthStore((state) => state.user?.role);
    const location = useLocation();
    return (
        <>
            <PageHeader eyebrow="403" title="접근 권한이 없습니다" />
            <Card>
                <EmptyState title={`${USER_ROLE_LABEL[role] ?? ''} 계정으로는 이 화면을 사용할 수 없습니다.`}>
                    {location.state?.from && <p className="num caption1">{location.state.from}</p>}
                    <ButtonLink to={homePathOf(role)}>내 첫 화면으로 이동</ButtonLink>
                </EmptyState>
            </Card>
        </>
    );
}
