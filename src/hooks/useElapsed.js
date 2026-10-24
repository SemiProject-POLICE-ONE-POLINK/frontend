import { useEffect, useState } from 'react';

// 시작 시각부터 지난 초. 끝난 작업이면 끝난 시각까지만 센다. 진행 중일 때만 1초마다 다시 그린다.
export function useElapsed(startedAt, finishedAt) {
    const running = Boolean(startedAt) && !finishedAt;
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!running) {
            return undefined;
        }
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [running]);

    if (!startedAt) {
        return 0;
    }
    return Math.max(0, Math.floor(((finishedAt ?? now) - startedAt) / 1000));
}

// 경과 시간 표시(0:42, 1:05). 퍼센트 대신 실제로 흐른 시간만 보여 준다.
export const formatElapsed = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
