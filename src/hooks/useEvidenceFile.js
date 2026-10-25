import { useEffect, useState } from 'react';
import { getEvidenceFile } from '../api/investigations';

// 증거물 첨부 파일을 JWT를 붙여 Blob으로 받아 화면에서 쓸 주소(object URL)로 바꾼다.
// 화면을 떠나거나 파일이 바뀌면 주소를 해제해 메모리에 남기지 않는다. 서버는 브라우저 캐시를 막는다(no-store).
export function useEvidenceFile(fileUrl) {
    const [result, setResult] = useState({ status: 'loading', url: null, type: null, error: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!fileUrl) {
            return undefined;
        }
        let ignore = false;
        let objectUrl = null;
        getEvidenceFile(fileUrl).then(
            (blob) => {
                if (ignore) {
                    return;
                }
                objectUrl = URL.createObjectURL(blob);
                setResult({ status: 'done', url: objectUrl, type: blob.type, error: null });
            },
            (error) => {
                if (!ignore) {
                    setResult({ status: 'error', url: null, type: null, error });
                }
            }
        );
        return () => {
            ignore = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [fileUrl, attempt]);

    const retry = () => {
        setResult({ status: 'loading', url: null, type: null, error: null });
        setAttempt((count) => count + 1);
    };

    return { ...result, isImage: Boolean(result.type?.startsWith('image/')), retry };
}
