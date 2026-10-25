import client from './client';

// MyInfoController.findMyInfo — GET /api/v1/users/me
export async function getMyInfo() {
    const response = await client.get('/api/v1/users/me');
    return response.data;
}

// CitizenMyPageController.getMyPage — GET /api/v1/users/me/mypage (시민 전용)
export async function getCitizenMyPage() {
    const response = await client.get('/api/v1/users/me/mypage');
    return response.data;
}

// PoliceDashboardController.getPoliceDashboard — GET /api/v1/users/me/police-dashboard (경찰 전용)
export async function getPoliceDashboard() {
    const response = await client.get('/api/v1/users/me/police-dashboard');
    return response.data;
}

// AdminDashboardController.getAdminDashboard — GET /api/v1/users/me/admin-dashboard (관리자 전용)
export async function getAdminDashboard() {
    const response = await client.get('/api/v1/users/me/admin-dashboard');
    return response.data;
}

// AdminUserController.getAssignablePolice — GET /api/v1/users/police-officers (관리자 전용)
export async function getAssignablePolice() {
    const response = await client.get('/api/v1/users/police-officers');
    return response.data;
}
