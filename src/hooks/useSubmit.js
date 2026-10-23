import { useCallback, useRef, useState } from 'react';

// 비동기 처리 중 중복 제출을 막고, 실패 시 정규화된 오류를 보관한다.
// submit은 성공하면 결과를, 실패하거나 이미 처리 중이면 undefined를 돌려준다.
export function useSubmit() {
    const inFlight = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const submit = useCallback(async (action) => {
        if (inFlight.current) {
            return undefined;
        }
        inFlight.current = true;
        setSubmitting(true);
        setError(null);
        try {
            return await action();
        } catch (err) {
            setError(err);
            return undefined;
        } finally {
            inFlight.current = false;
            setSubmitting(false);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return { submit, submitting, error, clearError };
}
