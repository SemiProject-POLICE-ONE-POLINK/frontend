// 빈 검색 조건은 빈 문자열로 보내지 않고 query parameter에서 생략한다.
export function compactParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== ''
        )
    );
}

// URL의 page는 1부터 표시하고, 서버 요청 직전에 0 기반으로 바꾼다.
export function readUiPage(searchParams) {
    const page = Number(searchParams.get('page'));
    return Number.isInteger(page) && page > 0 ? page : 1;
}

export function toServerPage(uiPage) {
    return Math.max(uiPage - 1, 0);
}
