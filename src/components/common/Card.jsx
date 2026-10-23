import { useId } from 'react';
import styles from './Card.module.css';

export default function Card({ title, subtitle, actions, children, className = '', as: Tag = 'section', padded = true, id }) {
    const headingId = useId();
    return (
        <Tag id={id} className={`${styles.card} ${className}`} aria-labelledby={title ? headingId : undefined}>
            {(title || actions) && (
                <header className={styles.header}>
                    <div className={styles.headText}>
                        {title && (
                            <h2 id={headingId} className="title3">
                                {title}
                            </h2>
                        )}
                        {subtitle && <span className={`${styles.subtitle} caption1`}>{subtitle}</span>}
                    </div>
                    {actions && <div className={styles.actions}>{actions}</div>}
                </header>
            )}
            <div className={padded ? styles.body : ''}>{children}</div>
        </Tag>
    );
}
