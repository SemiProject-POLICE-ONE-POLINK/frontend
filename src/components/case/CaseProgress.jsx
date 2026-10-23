import { CASE_STATUS } from '../../constants/codes';
import { formatDate } from '../../utils/format';
import styles from './CaseProgress.module.css';

// 별도 프론트 enum 없이 CaseStatus로 진행 단계를 표현한다.
// 최초 배정 시 서버가 상태를 수사 중으로 바꾸므로 수사 중·종결 대기·종결이면 배정이 끝난 것이다.
const ASSIGNED_STATUSES = [CASE_STATUS.INVESTIGATING, CASE_STATUS.INVESTIGATION_DONE, CASE_STATUS.CLOSED];

function doneFlags(status) {
    const assigned = ASSIGNED_STATUSES.includes(status);
    return [true, assigned, assigned, status === CASE_STATUS.CLOSED];
}

export default function CaseProgress({ status, receivedAt, closedAt }) {
    const canceled = status === CASE_STATUS.CANCELED;
    const done = doneFlags(status);
    const current = done.findIndex((flag) => !flag);
    const steps = [
        { label: '접수', date: receivedAt },
        { label: '담당 배정' },
        { label: '수사 중' },
        // 수사가 끝나 관리자 종결을 기다리는 동안은 마지막 단계를 "종결 대기"로 보여 준다.
        { label: status === CASE_STATUS.INVESTIGATION_DONE ? '종결 대기' : '종결', date: closedAt },
    ];

    return (
        <ol className={`${styles.steps} ${canceled ? styles.canceled : ''}`} aria-label={canceled ? '사건 진행 단계 (접수 취소됨)' : '사건 진행 단계'}>
            {steps.map((step, index) => {
                const state = done[index] ? 'done' : index === current && !canceled ? 'now' : 'todo';
                return (
                    <li key={step.label} className={`${styles.step} ${styles[state]}`} aria-current={state === 'now' ? 'step' : undefined}>
                        <span className={`${styles.dot} caption2`} aria-hidden="true">
                            {state === 'done' ? '✓' : index + 1}
                        </span>
                        <span className={`${styles.label} caption2`}>{step.label}</span>
                        <span className={`${styles.date} micro`}>{state === 'done' && step.date ? formatDate(step.date).slice(5) : ''}</span>
                        <span className="visually-hidden">{state === 'done' ? '완료' : state === 'now' ? '진행 중' : '예정'}</span>
                    </li>
                );
            })}
        </ol>
    );
}
