import styles from './DataTable.module.css';

// columns: [{ key, header, render?(row), mono?, width?, align? }]
// onRowClick이 있으면 행 전체를 키보드(Enter)로도 열 수 있게 한다.
export default function DataTable({ columns, rows, rowKey, caption, emptyText = '조회된 항목이 없습니다.', onRowClick, rowLabel }) {
    const handleKey = (event, row) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
            onRowClick(row);
        }
    };

    return (
        <div className={styles.wrap}>
            <table className={styles.table}>
                {caption && <caption className="visually-hidden">{caption}</caption>}
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" className="caption2" style={{ width: column.width, textAlign: column.align }}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={`${styles.empty} body2`}>
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className={onRowClick ? styles.clickable : undefined}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                onKeyDown={onRowClick ? (event) => handleKey(event, row) : undefined}
                                tabIndex={onRowClick ? 0 : undefined}
                                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <td key={column.key} className={`body2 ${column.mono ? 'num' : ''}`} style={{ textAlign: column.align }}>
                                        {column.render ? column.render(row) : row[column.key] ?? '-'}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
