import styles from './PageHeader.module.css';

export default function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <header className={styles.header}>
            <div>
                {eyebrow && <p className={`${styles.eyebrow} eyebrow`}>{eyebrow}</p>}
                <h1 className="display">{title}</h1>
                {description && <p className={`${styles.description} body1`}>{description}</p>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
        </header>
    );
}
