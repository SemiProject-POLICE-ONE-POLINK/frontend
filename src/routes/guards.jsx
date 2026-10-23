import { Navigate, Outlet, useLocation } from 'react-router';
import { selectIsLoggedIn, useAuthStore } from '../store/authStore';
import { homePathOf } from '../config/nav';

export function RequireAuth() {
    const isLoggedIn = useAuthStore(selectIsLoggedIn);
    const location = useLocation();
    if (!isLoggedIn) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    return <Outlet />;
}

// 메뉴 접근 보조용 가드. 실제 접근 권한은 서버의 401·403 응답이 최종 기준이다.
export function RequireRole({ roles }) {
    const role = useAuthStore((state) => state.user?.role);
    const location = useLocation();
    if (!roles.includes(role)) {
        return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
}

export function GuestOnly() {
    const isLoggedIn = useAuthStore(selectIsLoggedIn);
    const role = useAuthStore((state) => state.user?.role);
    if (isLoggedIn) {
        return <Navigate to={homePathOf(role)} replace />;
    }
    return <Outlet />;
}

export function RoleHome() {
    const role = useAuthStore((state) => state.user?.role);
    return <Navigate to={homePathOf(role)} replace />;
}
