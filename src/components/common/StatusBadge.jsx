import { STATUS_TONE } from '../../constants/codes';
import styles from './StatusBadge.module.css';

// 색상만으로 상태를 구분하지 않도록 한글 라벨을 항상 함께 표시한다.
export default function StatusBadge({ code, labels, tone }) {
    if (!code) {
        return <span className="caption1">-</span>;
    }
    const resolvedTone = tone ?? STATUS_TONE[code] ?? 'cancel';
    return (
        <span className={`${styles.badge} ${styles[resolvedTone]} caption2`}>
            <span className={styles.dot} aria-hidden="true" />
            {labels?.[code] ?? code}
        </span>
    );
}
