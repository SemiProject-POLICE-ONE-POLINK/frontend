import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { USER_ROLE } from '../constants/codes';
import ChatbotPanel from '../components/chatbot/ChatbotPanel';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AppLayout.module.css';

export default function AppLayout() {
    const role = useAuthStore((state) => state.user?.role);
    const location = useLocation();
    const [menuState, setMenuState] = useState({ open: false, path: location.pathname });

    // 경로가 바뀌면 모바일 메뉴를 닫는다. 렌더 중 비교로 effect 없이 처리한다.
    const menuOpen = menuState.open && menuState.path === location.pathname;
    // 수사 보드는 3열 카드 배치라 넓은 콘텐츠 폭을 쓴다.
    const wide = location.pathname.startsWith('/board/');

    return (
        <div className={styles.shell}>
            <a href="#main" className={styles.skip}>
                본문 바로가기
            </a>
            <Sidebar role={role} open={menuOpen} onClose={() => setMenuState({ open: false, path: location.pathname })} />
            <div className={styles.main}>
                <Header onMenuClick={() => setMenuState({ open: !menuOpen, path: location.pathname })} menuOpen={menuOpen} />
                <main id="main" className={`${styles.content} ${wide ? styles.wide : ''}`} tabIndex={-1}>
                    <Outlet />
                </main>
            </div>
            {/* AI 분실물 챗봇은 시민 전 화면에서 연다(CIT-008). */}
            {role === USER_ROLE.CITIZEN && <ChatbotPanel />}
        </div>
    );
}
