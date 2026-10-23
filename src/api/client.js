import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { normalizeAxiosError } from '../utils/errors';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 30000,
});

client.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

// 정규화한 오류(status, message, data)만 화면으로 넘긴다.
// 401은 refresh API가 없으므로 인증 상태를 비우고, 보호 라우트가 로그인 화면으로 보낸다.
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const apiError = normalizeAxiosError(error);
        if (apiError.status === 401 && useAuthStore.getState().accessToken) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(apiError);
    }
);

export default client;
