import { useCallback, useState } from 'react';

const STORAGE_KEY = 'polink-theme';

function readStoredTheme() {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === 'light' || value === 'dark' ? value : null;
    } catch {
        return null;
    }
}

// 저장된 선택이 없으면 data-theme을 두지 않아 tokens.css의 prefers-color-scheme을 따른다.
export function applyStoredTheme() {
    const stored = readStoredTheme();
    if (stored) {
        document.documentElement.dataset.theme = stored;
    }
}

function currentTheme() {
    const applied = document.documentElement.dataset.theme;
    if (applied === 'light' || applied === 'dark') {
        return applied;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// tokens.css가 :root[data-theme]로 테마를 재정의하므로 data-theme만 바꾼다.
export function useTheme() {
    const [theme, setTheme] = useState(currentTheme);

    const toggle = useCallback(() => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // 저장소를 쓸 수 없는 환경에서도 현재 탭의 테마 전환은 동작한다.
        }
        setTheme(next);
    }, []);

    return { theme, toggle };
}
