import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import CaseListPage from '../pages/case/CaseListPage';
import CaseCreatePage from '../pages/case/CaseCreatePage';
import CaseAiSearchPage from '../pages/case/CaseAiSearchPage';
import CaseDetailPage from '../pages/case/CaseDetailPage';

// 담당: A — 사건 목록·상세(전 역할), 사건 접수·AI 유사 사건(시민)
export const caseRoutes = (
    <>
        <Route path="cases" element={<CaseListPage />} />
        <Route path="cases/:caseId" element={<CaseDetailPage />} />
        <Route element={<RequireRole roles={[USER_ROLE.CITIZEN]} />}>
            <Route path="cases/new" element={<CaseCreatePage />} />
            <Route path="cases/ai-search" element={<CaseAiSearchPage />} />
        </Route>
    </>
);
