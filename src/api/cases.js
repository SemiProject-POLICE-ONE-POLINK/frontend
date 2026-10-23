import client from './client';

// 사건 목록은 items와 totalElements만 제공한다. 페이지 메타데이터를 임의로 만들지 않는다.

// CaseController.createCase — POST /api/v1/cases (시민 전용, 201)
export async function createCase({ title, caseType, description, occurredAt, location }) {
    const response = await client.post('/api/v1/cases', {
        title,
        caseType,
        description,
        occurredAt,
        location,
    });
    return response.data;
}

// CaseController.getCases — GET /api/v1/cases (시민은 본인 신고, 경찰·관리자는 전체)
export async function getCases({ page, size }) {
    const response = await client.get('/api/v1/cases', { params: { page, size } });
    return response.data;
}

// CaseController.getMyCases — GET /api/v1/cases/my (시민은 신고 사건, 경찰은 배정 사건)
export async function getMyCases({ page, size }) {
    const response = await client.get('/api/v1/cases/my', { params: { page, size } });
    return response.data;
}

// CaseController.getCaseDetail — GET /api/v1/cases/{caseId}
export async function getCaseDetail(caseId) {
    const response = await client.get(`/api/v1/cases/${encodeURIComponent(caseId)}`);
    return response.data;
}

// CaseController.assignOfficer — PATCH /api/v1/cases/{caseId}/officer (관리자 전용)
export async function assignOfficer(caseId, officerId) {
    const response = await client.patch(`/api/v1/cases/${encodeURIComponent(caseId)}/officer`, {
        officerId,
    });
    return response.data;
}

// CaseController.closeCase — POST /api/v1/cases/{caseId}/close (관리자 전용)
// 화면 정의서(ADM-005)는 처리 결과와 종결 사유를 따로 받지만 서버는 closeReason 하나만 받으므로
// 두 값을 이 경계에서 한 문장으로 합쳐 보낸다. 서버에 필드가 생기면 여기만 바꾼다.
export async function closeCase(caseId, { result, reason }) {
    const response = await client.post(`/api/v1/cases/${encodeURIComponent(caseId)}/close`, {
        closeReason: `[처리 결과] ${result} / [종결 사유] ${reason}`,
    });
    return response.data;
}

// CaseAiSearchController.searchSimilarCases — POST /api/v1/cases/ai-search (시민 전용)
export async function searchSimilarCases(situation) {
    const response = await client.post('/api/v1/cases/ai-search', { situation });
    return response.data;
}
