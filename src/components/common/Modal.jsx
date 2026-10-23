import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

// 네이티브 dialog의 showModal을 사용해 포커스 가두기와 Esc 닫기를 브라우저에 맡긴다.
// 바깥 영역(backdrop) 클릭으로도 닫는다. title이 없으면 안내 문구만 보이는 팝업(CIT-001P)이 된다.
export default function Modal({ open, title, ariaLabel, onClose, children, footer, wide = false }) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleCancel = (event) => {
        event.preventDefault();
        onClose();
    };

    const handleBackdrop = (event) => {
        if (event.target === dialogRef.current) {
            onClose();
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${styles.dialog} ${wide ? styles.wide : ''}`}
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            onCancel={handleCancel}
            onClick={handleBackdrop}
        >
            {open && (
                <div className={styles.inner}>
                    {title && (
                        <header className={styles.header}>
                            <h2 id={titleId} className="title3">
                                {title}
                            </h2>
                            <button type="button" className={`${styles.close} caption2`} onClick={onClose}>
                                닫기
                            </button>
                        </header>
                    )}
                    <div className={styles.body}>{children}</div>
                    {footer && <footer className={styles.footer}>{footer}</footer>}
                </div>
            )}
        </dialog>
    );
}
