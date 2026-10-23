import styles from './Layout.module.css';

// 세로 간격 묶음. gap은 디자인 토큰 간격 이름(8, 12, 16, 24)을 사용한다.
export function Stack({ gap = 16, as: Tag = 'div', className = '', children, ...rest }) {
    return (
        <Tag className={`${styles.stack} ${styles[`gap${gap}`] ?? ''} ${className}`} {...rest}>
            {children}
        </Tag>
    );
}

// 넓은 화면에서 여러 열, 좁은 화면(1100px 이하)에서 한 열로 접힌다.
export function Columns({ layout = 'equal', children }) {
    return <div className={`${styles.columns} ${styles[layout]}`}>{children}</div>;
}

// 목록 상단의 필터·탭·버튼 줄.
export function Toolbar({ children }) {
    return <div className={styles.toolbar}>{children}</div>;
}

export function Inline({ children, gap = 8 }) {
    return <div className={`${styles.inline} ${styles[`gap${gap}`] ?? ''}`}>{children}</div>;
}
