import { useAuthStore } from '../../store/authStore';
import { homePathOf } from '../../config/nav';
import PageHeader from '../../components/common/PageHeader';
import { ButtonLink } from '../../components/common/Button';
import { EmptyState } from '../../components/common/Feedback';
import Card from '../../components/common/Card';

export default function NotFoundPage() {
    const role = useAuthStore((state) => state.user?.role);
    return (
        <>
            <PageHeader eyebrow="404" title="페이지를 찾을 수 없습니다" />
            <Card>
                <EmptyState title="주소가 잘못되었거나 이동된 화면입니다.">
                    <ButtonLink to={homePathOf(role)}>내 첫 화면으로 이동</ButtonLink>
                </EmptyState>
            </Card>
        </>
    );
}
