import { Link } from 'react-router';
import styles from './Button.module.css';

function buttonClass({ variant = 'primary', size = 'md', block = false, className = '' }) {
    return [styles.button, styles[variant], styles[size], block ? styles.block : '', className, 'body2']
        .filter(Boolean)
        .join(' ');
}

export function Button({ variant, size, block, className, type = 'button', loading = false, loadingText, children, disabled, ...rest }) {
    return (
        <button
            type={type}
            className={buttonClass({ variant, size, block, className })}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading ? loadingText ?? '처리 중…' : children}
        </button>
    );
}

export function ButtonLink({ variant, size, block, className, children, ...rest }) {
    return (
        <Link className={buttonClass({ variant, size, block, className })} {...rest}>
            {children}
        </Link>
    );
}
