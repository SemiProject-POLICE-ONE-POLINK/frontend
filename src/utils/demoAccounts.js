// 시연용 데모 계정(COM-001 ④). 계정·비밀번호를 소스에 두지 않도록
// 커밋하지 않는 .env.local의 VITE_DEMO_ACCOUNTS에서만 읽는다.
// 형식: 아이디|비밀번호|표시 이름|ROLE;아이디|비밀번호|표시 이름|ROLE
export function readDemoAccounts() {
    const raw = import.meta.env.VITE_DEMO_ACCOUNTS;
    if (!raw) {
        return [];
    }
    return raw
        .split(';')
        .map((entry) => entry.split('|').map((part) => part.trim()))
        .filter((parts) => parts.length === 4 && parts[0] && parts[1])
        .map(([userName, password, name, role]) => ({ userName, password, name, role }));
}
