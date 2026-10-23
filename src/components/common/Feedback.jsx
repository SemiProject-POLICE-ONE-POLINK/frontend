import { Link } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { homePathOf } from '../../config/nav';
import { Button } from './Button';
import styles from './Feedback.module.css';

export function Alert({ tone = 'info', title, children }) {
    // 오류는 즉시 읽어주고, 그 외 안내는 흐름을 끊지 않게 polite로 알린다.
    const role = tone === 'error' ? 'alert' : 'status';
    return (
        <div className={`${styles.alert} ${styles[tone]}`} role={role}>
            {title && <p className="label">{title}</p>}
            <div className="body2">{children}</div>
        </div>
    );
}

export function LoadingState({ text = '불러오는 중입니다…' }) {
    return (
        <p className={`${styles.state} body2`} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            {text}
        </p>
    );
}

export function EmptyState({ title = '표시할 내용이 없습니다.', children }) {
    return (
        <div className={styles.empty}>
            <p className="title3">{title}</p>
            {children && <div className={`${styles.emptyBody} body2`}>{children}</div>}
        </div>
    );
}

// 401은 인터셉터가 로그인 상태를 비워 보호 라우트가 처리하므로, 여기서는 그 외 상태를 안내한다.
export function ErrorState({ error, onRetry }) {
    const role = useAuthStore((state) => state.user?.role);
    if (!error) {
        return null;
    }
    return (
        <Alert tone="error" title={titleOf(error.status)}>
            <p>{error.message}</p>
            <div className={styles.errorActions}>
                {error.status === 409 && onRetry && (
                    <Button size="sm" variant="secondary" onClick={onRetry}>
                        최신 정보 다시 조회
                    </Button>
                )}
                {error.status !== 403 && error.status !== 404 && error.status !== 409 && onRetry && (
                    <Button size="sm" variant="secondary" onClick={onRetry}>
                        다시 시도
                    </Button>
                )}
                {(error.status === 403 || error.status === 404) && (
                    <Link className="body2" to={homePathOf(role)}>
                        내 첫 화면으로 이동
                    </Link>
                )}
            </div>
        </Alert>
    );
}

function titleOf(status) {
    switch (status) {
        case 400:
            return '입력 또는 처리 조건 오류';
        case 403:
            return '권한 없음';
        case 404:
            return '정보 없음';
        case 409:
            return '상태 충돌';
        case 413:
            return '파일 용량 초과';
        case 0:
            return '연결 오류';
        default:
            return '요청 실패';
    }
}

export function AiNotice({ children }) {
    return (
        <p className={`${styles.ai} caption1`}>
            <span className={`${styles.aiChip} micro`}>AI</span>
            {children ?? 'AI 분석 결과는 참고 정보입니다. 최종 판단과 처리는 담당자가 확인 후 진행합니다.'}
        </p>
    );
}
