import { Link, useLocation } from 'react-router';
import { NAV_BY_ROLE, isNavActive } from '../config/nav';
import Icon, { Emblem } from '../components/common/Icon';
import styles from './Sidebar.module.css';

export default function Sidebar({ role, open, onClose }) {
    const { pathname } = useLocation();
    const groups = NAV_BY_ROLE[role] ?? [];
    return (
        <>
            <aside id="app-sidebar" className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-label="주 메뉴">
                <div className={styles.brand}>
                    <Emblem size={34} />
                    <div>
                        <b className={styles.title}>POLINK</b>
                        <small className={`${styles.sub} caption1`}>AI 경찰 업무 통합 관리 시스템</small>
                    </div>
                </div>
                <nav className={styles.nav}>
                    {groups.map((group) => (
                        <div key={group.group}>
                            <p className={`${styles.groupTitle} micro`}>{group.group}</p>
                            <ul>
                                {group.items.map((item) => {
                                    const active = isNavActive(item, pathname);
                                    return (
                                        <li key={item.to}>
                                            <Link
                                                to={item.to}
                                                className={`${styles.link} body2 ${active ? styles.active : ''}`}
                                                aria-current={active ? 'page' : undefined}
                                            >
                                                <Icon name={item.icon} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>
            {open && <button type="button" className={styles.scrim} aria-label="메뉴 닫기" onClick={onClose} />}
        </>
    );
}
