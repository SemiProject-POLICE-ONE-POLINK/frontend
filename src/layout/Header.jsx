import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { USER_ROLE_LABEL } from '../constants/codes';
import { activeNavLabel } from '../config/nav';
import styles from './Header.module.css';

export default function Header({ onMenuClick, menuOpen }) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const closeChat = useChatStore((state) => state.setOpen);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const roleLabel = USER_ROLE_LABEL[user?.role] ?? '';

    const handleLogout = () => {
        closeChat(false);
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <header className={styles.header}>
            <button
                type="button"
                className={styles.menuButton}
                onClick={onMenuClick}
                aria-label="메뉴 열기"
                aria-expanded={menuOpen}
                aria-controls="app-sidebar"
            >
                ☰
            </button>
            <p className={`${styles.crumb} caption1`}>
                {roleLabel} 콘솔 / <b>{activeNavLabel(user?.role, pathname)}</b>
            </p>
            <div className={styles.spacer} />
            {user && (
                <div className={styles.who}>
                    <span className={`${styles.avatar} label`} aria-hidden="true">
                        {user.name?.[0]}
                    </span>
                    <div>
                        <div className={`${styles.name} label`}>{user.name}</div>
                        <div className={`${styles.role} caption1`}>
                            {roleLabel} · <span className="num">{user.userName}</span>
                        </div>
                    </div>
                </div>
            )}
            <button type="button" className={`${styles.ghost} caption2`} onClick={handleLogout}>
                로그아웃
            </button>
        </header>
    );
}
