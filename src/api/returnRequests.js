import client from './client';
import { compactParams } from '../utils/query';

// 시민 목록과 경찰 목록 모두 페이지 메타데이터를 제공한다.

// ReturnRequestController.createReturnRequest — POST /api/v1/return-requests (시민 전용, 201)
export async function createReturnRequest({ lostItemId, foundItemId, requestReason }) {
    const response = await client.post('/api/v1/return-requests', {
        lostItemId,
        foundItemId,
        requestReason,
    });
    return response.data;
}

// ReturnRequestController.getMyReturnRequests — GET /api/v1/return-requests/my (시민 전용)
export async function getMyReturnRequests({ status, page, size }) {
    const response = await client.get('/api/v1/return-requests/my', {
        params: compactParams({ status, page, size }),
    });
    return response.data;
}

// ReturnRequestController.getMyReturnRequestDetail — GET /api/v1/return-requests/my/{requestId}
export async function getMyReturnRequestDetail(requestId) {
    const response = await client.get(`/api/v1/return-requests/my/${encodeURIComponent(requestId)}`);
    return response.data;
}

// ReturnRequestController.getReturnRequests — GET /api/v1/return-requests (경찰·관리자 조회)
export async function getReturnRequests({ status, keyword, page, size }) {
    const response = await client.get('/api/v1/return-requests', {
        params: compactParams({ status, keyword, page, size }),
    });
    return response.data;
}

// ReturnRequestController.getReturnRequestDetail — GET /api/v1/return-requests/{requestId} (경찰·관리자 조회)
export async function getReturnRequestDetail(requestId) {
    const response = await client.get(`/api/v1/return-requests/${encodeURIComponent(requestId)}`);
    return response.data;
}

// ReturnRequestController.approveReturnRequest — PATCH /api/v1/return-requests/{requestId}/approve
export async function approveReturnRequest(requestId) {
    const response = await client.patch(`/api/v1/return-requests/${encodeURIComponent(requestId)}/approve`);
    return response.data;
}

// ReturnRequestController.rejectReturnRequest — PATCH /api/v1/return-requests/{requestId}/reject
export async function rejectReturnRequest(requestId, rejectReason) {
    const response = await client.patch(`/api/v1/return-requests/${encodeURIComponent(requestId)}/reject`, {
        rejectReason,
    });
    return response.data;
}

// ReturnRequestController.completeReturnRequest — PATCH /api/v1/return-requests/{requestId}/complete
export async function completeReturnRequest(requestId) {
    const response = await client.patch(`/api/v1/return-requests/${encodeURIComponent(requestId)}/complete`);
    return response.data;
}
