import client from './client';

// 수사 API는 담당 경찰만 사용할 수 있고, 목록은 DTO 배열을 그대로 반환한다.
const casePath = (caseId) => `/api/v1/cases/${encodeURIComponent(caseId)}`;

// InvestigationBoardController.getInvestigationBoard — GET /api/v1/cases/{caseId}/investigation-board
export async function getInvestigationBoard(caseId) {
    const response = await client.get(`${casePath(caseId)}/investigation-board`);
    return response.data;
}

// EvidenceController.findEvidenceList — GET /api/v1/cases/{caseId}/evidences
export async function getEvidences(caseId) {
    const response = await client.get(`${casePath(caseId)}/evidences`);
    return response.data;
}

// EvidenceController.createEvidence / createEvidenceWithFile — POST /api/v1/cases/{caseId}/evidences
// 파일이 없으면 JSON, 있으면 request(JSON Blob) + file 파트의 multipart로 보낸다.
export async function createEvidence(caseId, { evidenceName, evidenceType, description, acquiredLocation }, file) {
    const body = { evidenceName, evidenceType, description, acquiredLocation };
    if (!file) {
        const response = await client.post(`${casePath(caseId)}/evidences`, body);
        return response.data;
    }
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    formData.append('file', file);
    const response = await client.post(`${casePath(caseId)}/evidences`, formData);
    return response.data;
}

// WitnessController.findWitnessList — GET /api/v1/cases/{caseId}/witnesses
export async function getWitnesses(caseId) {
    const response = await client.get(`${casePath(caseId)}/witnesses`);
    return response.data;
}

// WitnessController.createWitness — POST /api/v1/cases/{caseId}/witnesses (목격자 + 최초 진술)
export async function createWitness(caseId, { name, phone, relationship, content }) {
    const response = await client.post(`${casePath(caseId)}/witnesses`, {
        name,
        phone,
        relationship,
        content,
    });
    return response.data;
}

// StatementController.createStatement — POST /api/v1/cases/{caseId}/witnesses/{witnessId}/statements
export async function createStatement(caseId, witnessId, { statementType, content }) {
    const response = await client.post(
        `${casePath(caseId)}/witnesses/${encodeURIComponent(witnessId)}/statements`,
        { statementType, content }
    );
    return response.data;
}

// InvestigationLogController.getFindInvestigationLogs — GET /api/v1/cases/{caseId}/investigations
export async function getInvestigationLogs(caseId) {
    const response = await client.get(`${casePath(caseId)}/investigations`);
    return response.data;
}

// InvestigationLogController.createInvestigationLog — POST /api/v1/cases/{caseId}/investigations
export async function createInvestigationLog(caseId, { content, investigatedAt }) {
    const response = await client.post(`${casePath(caseId)}/investigations`, {
        content,
        investigatedAt,
    });
    return response.data;
}

// HypothesisController.generateHypotheses — POST /api/v1/cases/{caseId}/hypotheses/generate
// 생성 결과는 DB에 저장되지 않는 후보다. AI 응답은 1분 이상 걸릴 수 있어 이 요청만 대기 시간을 2분으로 늘린다.
const GENERATE_TIMEOUT_MS = 120000;

export async function generateHypotheses(caseId) {
    const response = await client.post(`${casePath(caseId)}/hypotheses/generate`, undefined, { timeout: GENERATE_TIMEOUT_MS });
    return response.data;
}

// HypothesisController.adoptHypothesis — POST /api/v1/cases/{caseId}/hypotheses
export async function adoptHypothesis(caseId, candidateId) {
    const response = await client.post(`${casePath(caseId)}/hypotheses`, { candidateId });
    return response.data;
}

// HypothesisController.getAdoptedHypotheses — GET /api/v1/cases/{caseId}/hypotheses
export async function getAdoptedHypotheses(caseId) {
    const response = await client.get(`${casePath(caseId)}/hypotheses`);
    return response.data;
}

// HypothesisChecklistController.getChecklist — GET /api/v1/cases/{caseId}/hypotheses/{hypothesisId}/checklist
// 채택·저장된 가설의 hypothesisId만 사용한다. 미채택 후보의 candidateId로는 요청하지 않는다.
export async function getHypothesisChecklist(caseId, hypothesisId) {
    const response = await client.get(`${casePath(caseId)}/hypotheses/${encodeURIComponent(hypothesisId)}/checklist`);
    return response.data;
}

// HypothesisChecklistController.updateCheckItem — PATCH /api/v1/cases/{caseId}/hypotheses/{hypothesisId}/checklist/{itemId}
// 성공하면 변경된 전체 체크리스트를 돌려준다.
export async function updateHypothesisCheckItem(caseId, hypothesisId, itemId, completed) {
    const response = await client.patch(
        `${casePath(caseId)}/hypotheses/${encodeURIComponent(hypothesisId)}/checklist/${encodeURIComponent(itemId)}`,
        { completed }
    );
    return response.data;
}

// InvestigationCloseController.closeInvestigation — POST /api/v1/cases/{caseId}/investigation/close
// 화면 정의서(POL-003)의 수사 처리 결과와 종결 사유를 서버의 closeReason 하나로 합쳐 보낸다.
export async function closeInvestigation(caseId, { result, reason }) {
    const response = await client.post(`${casePath(caseId)}/investigation/close`, {
        closeReason: `[수사 처리 결과] ${result} / [종결 사유] ${reason}`,
    });
    return response.data;
}
// 서버는 수사 종결 시 사건 상태를 INVESTIGATION_DONE(종결 대기)으로 바꾼다.
