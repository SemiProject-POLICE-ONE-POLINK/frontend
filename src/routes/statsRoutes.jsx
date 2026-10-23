import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import ItemStatsPage from '../pages/stats/ItemStatsPage';

// 담당: C — 물품 통계 (경찰·관리자)
export const statsRoutes = (
    <Route element={<RequireRole roles={[USER_ROLE.POLICE, USER_ROLE.ADMIN]} />}>
        <Route path="stats/items" element={<ItemStatsPage />} />
    </Route>
);
