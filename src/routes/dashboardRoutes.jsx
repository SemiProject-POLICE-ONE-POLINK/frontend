import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import PoliceDashboardPage from '../pages/dashboard/PoliceDashboardPage';
import AdminDashboardPage from '../pages/dashboard/AdminDashboardPage';

// 담당: B — 경찰·관리자 대시보드
export const dashboardRoutes = (
    <>
        <Route element={<RequireRole roles={[USER_ROLE.POLICE]} />}>
            <Route path="dashboard/police" element={<PoliceDashboardPage />} />
        </Route>
        <Route element={<RequireRole roles={[USER_ROLE.ADMIN]} />}>
            <Route path="dashboard/admin" element={<AdminDashboardPage />} />
        </Route>
    </>
);
