import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { readUiPage } from '../utils/query';

// 검색 조건과 페이지는 URL query string에 둬 새로고침·링크 공유 시에도 유지한다.
export function useQueryState() {
    const [searchParams, setSearchParams] = useSearchParams();

    const get = useCallback((key) => searchParams.get(key) ?? '', [searchParams]);

    // 조건을 바꾸면 결과 집합이 달라지므로 page를 1로 되돌린다.
    // 검색어 입력마다 방문 기록이 쌓이지 않도록 현재 기록을 교체한다.
    const update = useCallback(
        (patch, { resetPage = true } = {}) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                Object.entries(patch).forEach(([key, value]) => {
                    if (value === undefined || value === null || value === '') {
                        next.delete(key);
                    } else {
                        next.set(key, String(value));
                    }
                });
                if (resetPage && !('page' in patch)) {
                    next.delete('page');
                }
                return next;
            }, { replace: true });
        },
        [setSearchParams]
    );

    const setPage = useCallback((page) => update({ page: page > 1 ? page : '' }, { resetPage: false }), [update]);

    return { searchParams, get, update, page: readUiPage(searchParams), setPage };
}
