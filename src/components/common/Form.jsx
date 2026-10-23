import { useId } from 'react';
import styles from './Form.module.css';

// label·입력·오류를 묶어 접근성 속성을 한 곳에서 연결한다.
// children은 (controlProps) => 입력 요소 형태로 받아 id와 aria 속성을 전달한다.
export function Field({ label, required, hint, error, children, className = '' }) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={`${styles.field} ${className}`}>
            <label htmlFor={id} className={`${styles.label} label`}>
                {label}
                {required && (
                    <span className={styles.required} aria-hidden="true">
                        *
                    </span>
                )}
            </label>
            {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
            {hint && (
                <p id={hintId} className={`${styles.hint} caption1`}>
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className={`${styles.error} caption1`} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export function Input({ className = '', ...rest }) {
    return <input className={`${styles.control} body2 ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }) {
    return (
        <select className={`${styles.control} body2 ${className}`} {...rest}>
            {children}
        </select>
    );
}

export function Textarea({ className = '', rows = 5, ...rest }) {
    return <textarea className={`${styles.control} ${styles.textarea} body2 ${className}`} rows={rows} {...rest} />;
}

export function FormGrid({ children, columns = 2 }) {
    return <div className={`${styles.grid} ${columns === 1 ? styles.single : ''}`}>{children}</div>;
}

export function FormActions({ children }) {
    return <div className={styles.actions}>{children}</div>;
}

export function RadioGroup({ legend, name, value, options, onChange, required }) {
    return (
        <fieldset className={styles.fieldset}>
            <legend className={`${styles.label} label`}>
                {legend}
                {required && (
                    <span className={styles.required} aria-hidden="true">
                        *
                    </span>
                )}
            </legend>
            <div className={styles.radios}>
                {options.map((option) => (
                    <label key={option.value} className={`${styles.radio} body2`}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
