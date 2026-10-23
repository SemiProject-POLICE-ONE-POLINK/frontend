import { Route } from 'react-router';
import ItemListPage from '../pages/items/ItemListPage';
import ItemDetailPage from '../pages/items/ItemDetailPage';

// 담당: C — 분실물·습득물 목록·상세(CIT-005·006, 전 역할).
// 등록·수정(CIT-007)과 반환 신청(CIT-006P)은 팝업이라 별도 경로가 없다.
export const itemRoutes = (
    <>
        <Route path="items" element={<ItemListPage />} />
        <Route path="items/:itemId" element={<ItemDetailPage />} />
    </>
);
