// 서버 message가 없을 때만 쓰는 HTTP 상태별 공통 안내 문구.
export const STATUS_MESSAGES = {
    400: '입력값 또는 요청 조건을 확인해주세요.',
    401: '로그인이 필요하거나 로그인 시간이 만료되었습니다.',
    403: '이 기능을 사용할 권한이 없습니다.',
    404: '요청한 정보를 찾을 수 없습니다.',
    409: '현재 상태에서는 처리할 수 없습니다. 최신 정보를 다시 확인해주세요.',
    413: '파일 용량이 너무 큽니다. 2MB 이하 파일만 첨부할 수 있습니다.',
    500: '서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
};

export const NETWORK_ERROR_MESSAGE = '서버에 연결할 수 없습니다. 네트워크 또는 서버 실행 상태를 확인해주세요.';

export class ApiError extends Error {
    constructor(status, message, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// 서버 stack trace나 긴 내부 메시지는 화면에 그대로 노출하지 않는다.
function safeServerMessage(data) {
    const message = data && typeof data === 'object' ? data.message : null;
    if (typeof message !== 'string' || message.length === 0 || message.length > 300) {
        return null;
    }
    if (/\bat\s+[\w.$]+\(|Exception|java\./.test(message)) {
        return null;
    }
    return message;
}

// 도메인마다 오류 본문 형식이 달라(status 필드 유무) HTTP status를 우선한다.
export function normalizeAxiosError(error) {
    if (error instanceof ApiError) {
        return error;
    }
    const response = error?.response;
    if (!response) {
        return new ApiError(0, NETWORK_ERROR_MESSAGE, null);
    }
    const { status, data } = response;
    const fallback = STATUS_MESSAGES[status] ?? (status >= 500 ? STATUS_MESSAGES[500] : STATUS_MESSAGES[400]);
    return new ApiError(status, safeServerMessage(data) ?? fallback, data);
}

export function isConflict(error) {
    return error?.status === 409;
}
