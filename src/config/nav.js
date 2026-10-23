import { USER_ROLE } from '../constants/codes';

// 역할별 사이드바 메뉴의 단일 기준 (화면 정의서 v1.3 "권한별 메뉴 구조").
// match는 하위 화면에서도 메뉴를 강조하기 위한 경로 접두어다.
// 메뉴 노출은 사용성 보조이고 권한 판단은 서버가 한다.
export const NAV_BY_ROLE = {
    [USER_ROLE.CITIZEN]: [
        { group: '홈', items: [{ to: '/my', label: '마이페이지', icon: 'my' }] },
        {
            group: '업무',
            items: [
                { to: '/cases', label: '사건 목록', icon: 'cases', match: ['/cases/SMPA'] },
                // AI 유사 사건 찾기는 메뉴가 없고, 진입 시 사건 접수를 강조한다(CIT-004).
                { to: '/cases/new', label: '사건 접수', icon: 'report', match: ['/cases/ai-search'] },
            ],
        },
        { group: '분실물·습득물', items: [{ to: '/items', label: '분실물·습득물', icon: 'items', match: ['/items/'] }] },
    ],
    [USER_ROLE.POLICE]: [
        {
            group: '업무',
            items: [
                { to: '/dashboard/police', label: '대시보드', icon: 'dash' },
                { to: '/cases', label: '사건 목록', icon: 'cases', match: ['/cases/'] },
                { to: '/board', label: '수사 보드', icon: 'board', match: ['/board/'] },
            ],
        },
        {
            group: '분실물·습득물',
            items: [
                { to: '/items', label: '분실물·습득물', icon: 'items', match: ['/items/'] },
                { to: '/returns', label: '반환 신청 처리', icon: 'ret' },
                { to: '/stats/items', label: '분실물 통계', icon: 'stats' },
            ],
        },
    ],
    [USER_ROLE.ADMIN]: [
        {
            group: '업무',
            items: [
                { to: '/dashboard/admin', label: '대시보드', icon: 'dash' },
                { to: '/cases', label: '사건 목록', icon: 'cases', match: ['/admin/cases/'] },
            ],
        },
        {
            group: '분실물·습득물',
            items: [
                { to: '/items', label: '분실물·습득물', icon: 'items', match: ['/items/'] },
                { to: '/stats/items', label: '분실물 통계', icon: 'stats' },
            ],
        },
        { group: '계정', items: [{ to: '/admin/users', label: '사용자 권한', icon: 'users' }] },
    ],
};

export function isNavActive(item, pathname) {
    if (pathname === item.to) {
        return true;
    }
    return (item.match ?? []).some((prefix) => pathname.startsWith(prefix));
}

export function activeNavLabel(role, pathname) {
    const items = (NAV_BY_ROLE[role] ?? []).flatMap((group) => group.items);
    return items.find((item) => isNavActive(item, pathname))?.label ?? '';
}

const HOME_BY_ROLE = {
    [USER_ROLE.CITIZEN]: '/my',
    [USER_ROLE.POLICE]: '/dashboard/police',
    [USER_ROLE.ADMIN]: '/dashboard/admin',
};

export function homePathOf(role) {
    return HOME_BY_ROLE[role] ?? '/login';
}
