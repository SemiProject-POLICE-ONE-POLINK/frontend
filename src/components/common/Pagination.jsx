import styles from './Pagination.module.css';

const WINDOW = 5;

// page는 화면 기준 1부터 시작한다.
// totalPages가 없는 API는 페이지 수를 추정하지 않고 hasNext로 이전·다음만 제공한다.
export default function Pagination({ page, totalPages, hasNext, onPageChange }) {
    const knowsTotal = Number.isInteger(totalPages);
    if (knowsTotal && totalPages <= 1) {
        return null;
    }
    if (!knowsTotal && page <= 1 && !hasNext) {
        return null;
    }

    const canNext = knowsTotal ? page < totalPages : Boolean(hasNext);
    const pages = knowsTotal ? pageWindow(page, totalPages) : [];

    return (
        <nav className={styles.nav} aria-label="페이지 이동">
            <button type="button" className={`${styles.button} body2`} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                이전
            </button>
            {knowsTotal ? (
                pages.map((number) => (
                    <button
                        key={number}
                        type="button"
                        className={`${styles.button} ${number === page ? styles.current : ''} num body2`}
                        aria-current={number === page ? 'page' : undefined}
                        onClick={() => onPageChange(number)}
                    >
                        {number}
                    </button>
                ))
            ) : (
                <span className={`${styles.current} ${styles.button} num body2`} aria-current="page">
                    {page}
                </span>
            )}
            <button type="button" className={`${styles.button} body2`} disabled={!canNext} onClick={() => onPageChange(page + 1)}>
                다음
            </button>
        </nav>
    );
}

function pageWindow(page, totalPages) {
    const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
    const end = Math.min(totalPages, start + WINDOW - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
