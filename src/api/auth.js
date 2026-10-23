import client from './client';

// AuthController.signup — POST /api/v1/auth/signup (가입 계정은 시민으로 생성)
export async function signup({ userName, password, name, phone }) {
    const response = await client.post('/api/v1/auth/signup', { userName, password, name, phone });
    return response.data;
}

// AuthController.login — POST /api/v1/auth/login
export async function login({ userName, password }) {
    const response = await client.post('/api/v1/auth/login', { userName, password });
    return response.data;
}
