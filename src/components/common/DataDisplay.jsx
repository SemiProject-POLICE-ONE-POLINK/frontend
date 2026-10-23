import { Link } from 'react-router';
import { formatNumber } from '../../utils/format';
import styles from './DataDisplay.module.css';

export function KpiCard({ label, value, unit, hint, to }) {
    const content = (
        <>
            <span className={`${styles.kpiLabel} caption1`}>{label}</span>
            <span className="number">
                {formatNumber(value)}
                {unit && <small className={`${styles.kpiUnit} caption1`}>{unit}</small>}
            </span>
            {hint && <span className={`${styles.kpiHint} caption1`}>{hint}</span>}
        </>
    );
    if (to) {
        return (
            <Link to={to} className={`${styles.kpi} ${styles.kpiLink}`}>
                {content}
            </Link>
        );
    }
    return <div className={styles.kpi}>{content}</div>;
}

export function KpiGrid({ children }) {
    return <div className={styles.kpiGrid}>{children}</div>;
}

// items: [{ label, value, mono? }]
export function DescriptionList({ items }) {
    return (
        <dl className={styles.dl}>
            {items.map((item) => (
                <div key={item.label} className={`${styles.dlRow} ${item.wide ? styles.dlWide : ''}`}>
                    <dt className={`${styles.dt} label`}>{item.label}</dt>
                    <dd className={`body2 ${item.mono ? 'num' : ''} ${styles.dd}`}>{item.value ?? '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

// 단일 시리즈 크기 비교용 가로 막대. 값은 항상 텍스트로 함께 표시해 색에 의존하지 않는다.
export function BarList({ items, emptyText = '집계된 항목이 없습니다.' }) {
    if (items.length === 0) {
        return <p className={`${styles.muted} body2`}>{emptyText}</p>;
    }
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
        <ul className={styles.barList}>
            {items.map((item) => (
                <li key={item.key} className={styles.barRow} title={`${item.label}: ${formatNumber(item.value)}건`}>
                    <span className={`${styles.barLabel} body2`}>{item.label}</span>
                    <span className={styles.barTrack} aria-hidden="true">
                        <span className={styles.barFill} style={{ width: `${(item.value / max) * 100}%` }} />
                    </span>
                    <span className={`${styles.barValue} body2 num`}>{formatNumber(item.value)}</span>
                </li>
            ))}
        </ul>
    );
}

// 시간 순서 단일 시리즈 세로 막대. 각 막대에 hover 툴팁과 접근 가능한 라벨을 둔다.
export function ColumnChart({ items, label }) {
    if (items.length === 0) {
        return <p className={`${styles.muted} body2`}>집계된 항목이 없습니다.</p>;
    }
    const max = Math.max(...items.map((item) => item.value), 1);
    const first = items[0];
    const last = items[items.length - 1];
    return (
        <figure className={styles.columnFigure}>
            <div className={styles.columns} role="img" aria-label={label}>
                {items.map((item) => (
                    <span key={item.key} className={styles.columnSlot}>
                        <span className={styles.column} style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }} />
                        <span className={`${styles.tooltip} caption1`} role="tooltip">
                            <span className="num">{item.label}</span> · <strong className="num">{formatNumber(item.value)}</strong>건
                        </span>
                    </span>
                ))}
            </div>
            <figcaption className={`${styles.axis} caption1 num`}>
                <span>{first.label}</span>
                <span>최대 {formatNumber(max)}건</span>
                <span>{last.label}</span>
            </figcaption>
        </figure>
    );
}
