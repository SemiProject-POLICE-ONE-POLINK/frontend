import { Route } from 'react-router';
import { USER_ROLE } from '../constants/codes';
import { RequireRole } from './guards';
import BoardIndexPage from '../pages/board/BoardIndexPage';
import BoardLayout from '../pages/board/BoardLayout';
import BoardMainPage from '../pages/board/BoardMainPage';
import AiInferencePage from '../pages/board/AiInferencePage';
import EvidencePage from '../pages/board/EvidencePage';
import WitnessPage from '../pages/board/WitnessPage';
import InvestigationLogPage from '../pages/board/InvestigationLogPage';
import HypothesisPage from '../pages/board/HypothesisPage';

// 담당: B — 수사 보드(POL-002)와 탭(POL-010~014). 사건 접근은 서버가 담당 경찰인지 최종 검사한다.
export const boardRoutes = (
    <Route element={<RequireRole roles={[USER_ROLE.POLICE]} />}>
        <Route path="board" element={<BoardIndexPage />} />
        <Route path="board/:caseId" element={<BoardLayout />}>
            <Route index element={<BoardMainPage />} />
            <Route path="ai" element={<AiInferencePage />} />
            <Route path="evidences" element={<EvidencePage />} />
            <Route path="witnesses" element={<WitnessPage />} />
            <Route path="logs" element={<InvestigationLogPage />} />
            <Route path="hypotheses" element={<HypothesisPage />} />
        </Route>
    </Route>
);
