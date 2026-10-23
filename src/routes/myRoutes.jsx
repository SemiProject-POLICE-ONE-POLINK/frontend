import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import CitizenMyPage from '../pages/my/CitizenMyPage';

// 담당: C — 시민 마이페이지
export const myRoutes = (
    <Route element={<RequireRole roles={[USER_ROLE.CITIZEN]} />}>
        <Route path="my" element={<CitizenMyPage />} />
    </Route>
);
