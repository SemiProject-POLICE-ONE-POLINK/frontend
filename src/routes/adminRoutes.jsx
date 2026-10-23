import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import AdminCaseManagePage from '../pages/admin/AdminCaseManagePage';
import UserRolePage from '../pages/admin/UserRolePage';

// 담당: A — 관리자 사건 배정·종결, 사용자 권한
export const adminRoutes = (
    <Route element={<RequireRole roles={[USER_ROLE.ADMIN]} />}>
        <Route path="admin/cases/:caseId" element={<AdminCaseManagePage />} />
        <Route path="admin/users" element={<UserRolePage />} />
    </Route>
);
