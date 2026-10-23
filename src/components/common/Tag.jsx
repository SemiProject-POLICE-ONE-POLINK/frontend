import styles from './Tag.module.css';

// 유형·종류처럼 상태가 아닌 분류 표시. 상태는 StatusBadge를 쓴다.
export default function Tag({ children, tone }) {
    return <span className={`${styles.tag} ${tone ? styles[tone] : ''} caption2`}>{children}</span>;
}
