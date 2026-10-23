import client from './client';
import { compactParams } from '../utils/query';

const itemPath = (itemId) => `/api/v1/items/${encodeURIComponent(itemId)}`;

// ItemController.getItems — GET /api/v1/items (page 0 기반, 기본 size 10)
export async function getItems({ itemType, category, keyword, location, status, startDate, endDate, page, size }) {
    const response = await client.get('/api/v1/items', {
        params: compactParams({ itemType, category, keyword, location, status, startDate, endDate, page, size }),
    });
    return response.data;
}

// MyItemController.getMyItems — GET /api/v1/items/my (시민 전용)
export async function getMyItems({ page, size }) {
    const response = await client.get('/api/v1/items/my', { params: { page, size } });
    return response.data;
}

// ItemController.getItemDetail — GET /api/v1/items/{itemId} (L-0001 / F-0001 형식)
export async function getItemDetail(itemId) {
    const response = await client.get(itemPath(itemId));
    return response.data;
}

// ItemController.registerItem — POST /api/v1/items (multipart, image 최대 1개)
// Content-Type은 지정하지 않아 브라우저가 boundary를 붙이게 한다.
export async function registerItem({ itemType, itemName, category, description, location, occurredAt }, image) {
    const formData = new FormData();
    formData.append('itemType', itemType);
    formData.append('itemName', itemName);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('occurredAt', occurredAt);
    if (image) {
        formData.append('image', image);
    }
    const response = await client.post('/api/v1/items', formData);
    return response.data;
}

// ItemController.updateItem — PATCH /api/v1/items/{itemId} (JSON)
export async function updateItem(itemId, { itemName, category, description, location, occurredAt }) {
    const response = await client.patch(itemPath(itemId), {
        itemName,
        category,
        description,
        location,
        occurredAt,
    });
    return response.data;
}

// ItemController.attachLostItemImage — POST /api/v1/items/{itemId}/image (image 정확히 1개)
export async function attachItemImage(itemId, image) {
    const formData = new FormData();
    formData.append('image', image);
    const response = await client.post(`${itemPath(itemId)}/image`, formData);
    return response.data;
}

// ItemController.getItemStatistics — GET /api/v1/items/statistics (경찰·관리자)
export async function getItemStatistics({ startDate, endDate }) {
    const response = await client.get('/api/v1/items/statistics', {
        params: compactParams({ startDate, endDate }),
    });
    return response.data;
}

// ItemMatchController.findMatches — POST /api/v1/ai/item-matches (시민 전용)
export async function findItemMatches(lostItemId) {
    const response = await client.post('/api/v1/ai/item-matches', { lostItemId });
    return response.data;
}
