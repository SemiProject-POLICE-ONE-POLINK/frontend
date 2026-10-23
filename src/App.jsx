import { BrowserRouter, Route, Routes } from 'react-router';
import AppLayout from './layout/AppLayout';
import AuthLayout from './layout/AuthLayout';
import { GuestOnly, RequireAuth, RoleHome } from './routes/guards';
import { authRoutes } from './routes/authRoutes';
import { caseRoutes } from './routes/caseRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { boardRoutes } from './routes/boardRoutes';
import { myRoutes } from './routes/myRoutes';
import { itemRoutes } from './routes/itemRoutes';
import { returnRoutes } from './routes/returnRoutes';
import { statsRoutes } from './routes/statsRoutes';
import ForbiddenPage from './pages/error/ForbiddenPage';
import NotFoundPage from './pages/error/NotFoundPage';

// 라우트 조합은 A가 관리한다. 각 도메인 라우트는 routes/*Routes.jsx에서 수정한다.
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<GuestOnly />}>
                    <Route element={<AuthLayout />}>{authRoutes}</Route>
                </Route>
                <Route element={<RequireAuth />}>
                    <Route element={<AppLayout />}>
                        <Route index element={<RoleHome />} />
                        {myRoutes}
                        {dashboardRoutes}
                        {caseRoutes}
                        {adminRoutes}
                        {boardRoutes}
                        {itemRoutes}
                        {returnRoutes}
                        {statsRoutes}
                        <Route path="forbidden" element={<ForbiddenPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
