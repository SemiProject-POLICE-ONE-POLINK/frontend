import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import PoliceReturnListPage from '../pages/returns/PoliceReturnListPage';

// 담당: C — 반환 신청 처리 목록(POL-007). 비교·처리(POL-008)는 팝업이다.
export const returnRoutes = (
    <Route element={<RequireRole roles={[USER_ROLE.POLICE]} />}>
        <Route path="returns" element={<PoliceReturnListPage />} />
    </Route>
);
