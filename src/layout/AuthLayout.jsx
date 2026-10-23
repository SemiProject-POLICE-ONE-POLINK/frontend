import { NavLink, Outlet } from 'react-router';
import { Emblem } from '../components/common/Icon';
import styles from './AuthLayout.module.css';

const FEATURES = [
    ['CASE', '사건 접수·배정·종결'],
    ['INVEST', '수사기록·증거·진술 이력'],
    ['AI', '유사 사건·수사 가설·분실물 매칭'],
    ['LOST & FOUND', '등록·반환 신청·통계'],
];

export default function AuthLayout() {
    return (
        <div className={styles.wrap}>
            <section className={styles.art} aria-label="서비스 소개">
                <div className={styles.brand}>
                    <Emblem size={44} />
                    <div>
                        <p className={`${styles.brandEn} micro`}>AI POLICE · INTEGRATED OPERATIONS</p>
                        <p className="caption1">AI 경찰 업무 통합 관리 시스템</p>
                    </div>
                </div>
                <div>
                    <h1 className={styles.headline}>
                        사건 접수부터 수사 가설,
                        <br />
                        분실물 반환까지 한 화면에서.
                    </h1>
                    <p className={`${styles.lead} body1`}>
                        시민은 사건과 분실물을 신고하고, 담당 경찰은 증거·진술·AI 가설을 하나의 수사 보드에서 검토합니다. AI 결과는 언제나 참고
                        자료이며 확정은 수사관이 합니다.
                    </p>
                </div>
                <ul className={styles.features}>
                    {FEATURES.map(([key, text]) => (
                        <li key={key} className="caption1">
                            <b className="micro">{key}</b>
                            {text}
                        </li>
                    ))}
                </ul>
            </section>
            <main className={styles.formSide}>
                <nav className={styles.tabs} aria-label="로그인·회원가입">
                    <NavLink to="/login" className={({ isActive }) => `${styles.tab} label ${isActive ? styles.tabActive : ''}`}>
                        로그인
                    </NavLink>
                    <NavLink to="/signup" className={({ isActive }) => `${styles.tab} label ${isActive ? styles.tabActive : ''}`}>
                        회원가입
                    </NavLink>
                </nav>
                <Outlet />
            </main>
        </div>
    );
}
