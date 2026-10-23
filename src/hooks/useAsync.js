import { useCallback, useEffect, useState } from 'react';

// loader는 호출하는 화면에서 useCallback으로 고정한다. loader가 바뀌면 다시 요청한다.
// 재요청 중이거나 오류가 나도 직전 성공 데이터는 유지해 빈 화면으로 덮어쓰지 않는다.
export function useAsync(loader) {
    const [reloadCount, setReloadCount] = useState(0);
    const [result, setResult] = useState({ source: null, count: -1, data: null, error: null });

    useEffect(() => {
        let ignore = false;
        loader().then(
            (data) => {
                if (!ignore) {
                    setResult({ source: loader, count: reloadCount, data, error: null });
                }
            },
            (error) => {
                if (!ignore) {
                    setResult((prev) => ({ source: loader, count: reloadCount, data: prev.data, error }));
                }
            }
        );
        return () => {
            ignore = true;
        };
    }, [loader, reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);
    const loading = result.source !== loader || result.count !== reloadCount;

    return { data: result.data, error: loading ? null : result.error, loading, reload };
}
