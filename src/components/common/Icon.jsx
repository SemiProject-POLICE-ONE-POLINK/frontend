// 목업의 선형 아이콘 세트. 장식용이므로 기본으로 스크린 리더에서 숨긴다.
const PATHS = {
    dash: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
    cases: 'M4 4h12l4 4v12H4zM8 11h8M8 15h6',
    report: 'M12 5v14M5 12h14',
    ai: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z',
    board: 'M3 4h18v16H3zM9 4v16M15 4v16',
    items: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
    ret: 'M4 12h12M12 7l5 5-5 5M20 4v16',
    stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    my: 'M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
    users: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
    lock: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3',
    search: 'M11 5a6 6 0 110 12 6 6 0 010-12zM20 20l-4.5-4.5',
    chat: 'M4 5h16v11H9l-5 4z',
    clip: 'M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7',
    evidence: 'M4 5h16v15H4zM8 3v4M16 3v4M4 10h16',
    witness: 'M12 4a4 4 0 110 8 4 4 0 010-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6',
    log: 'M5 4h11l3 3v13H5zM8 11h8M8 15h6',
    timeline: 'M3 4h18v17H3zM3 9h18M8 2v4M16 2v4',
    brain: 'M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a3 3 0 00-3-1zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1',
    gem: 'M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 6 3-6M12 9v12',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    warn: 'M12 3l9 16H3zM12 10v4M12 17h.01',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2',
    // 물품 종류
    ELECTRONICS: 'M7 2h10v20H7zM11 18h2',
    WALLET_CARD: 'M2 6h20v13H2zM16 12h3M2 10h20',
    ACCESSORY: 'M12 5a7 7 0 110 14 7 7 0 010-14zM12 5V2M10 12h4',
    WATCH: 'M12 6a6 6 0 110 12 6 6 0 010-12zM12 9v3l2 1M9 2h6M9 22h6',
    CLOTHING_GOODS: 'M8 3l4 3 4-3 5 4-3 3v11H6V10L3 7z',
    ETC: 'M4 8l8-4 8 4v8l-8 4-8-4z',
    // 증거물 유형
    VIDEO: 'M3 5h14v14H3zM17 10l4-2v8l-4-2z',
    PHOTO: 'M3 6h18v14H3zM12 9.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM8 6l1.5-2h5L16 6',
    DOCUMENT: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5',
    SEIZED: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
};

export default function Icon({ name, size = 17, strokeWidth = 1.8, label, className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={label ? undefined : true}
            role={label ? 'img' : undefined}
            aria-label={label}
        >
            <path d={PATHS[name] ?? PATHS.ETC} />
        </svg>
    );
}

// 사이드바·로그인 화면의 별 모양 엠블럼.
export function Emblem({ size = 34 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 3l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L24 31.7l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z" fill="var(--color-hero-accent)" />
            <circle cx="24" cy="21.5" r="5.2" fill="var(--color-navy)" />
            <circle cx="24" cy="21.5" r="2.4" fill="var(--color-hero-accent)" />
        </svg>
    );
}
