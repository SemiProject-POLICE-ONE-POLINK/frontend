import { formatElapsed, useElapsed } from '../../hooks/useElapsed';
import Icon from '../common/Icon';
import styles from './AiInferenceProgress.module.css';

// 추론 진행 단계. 실제 진행률을 알 수 없으므로 퍼센트 대신 단계와 경과 시간만 보여 준다.
// 자료는 화면이 이미 불러왔으므로 완료, 서버 응답을 기다리는 동안은 AI 추론, 응답을 받으면 결과 화면으로 바뀐다.
const STEP_STATE_LABEL = { done: '완료', active: '진행 중', wait: '대기' };
const SLOW_NOTICE_SECONDS = 60;

export function AiInferenceProgress({ startedAt, evidenceCount, statementCount }) {
    const elapsed = useElapsed(startedAt, null);
    const steps = [
        { label: '자료 불러오기', sub: `사건 정보 · 증거물 ${evidenceCount}건 · 진술 ${statementCount}건`, state: 'done' },
        { label: 'AI 추론', sub: '관계도 · 불일치 지점 · 가설 최대 3개', state: 'active' },
        { label: '결과 정리', sub: '화면에 표시할 결과 준비', state: 'wait' },
    ];

    return (
        <section className={styles.card} aria-busy="true">
            <header className={styles.head}>
                <span className={styles.icon} aria-hidden="true">
                    <Icon name="brain" size={22} />
                </span>
                <div className={styles.headText}>
                    <h3 className="title2" role="status">
                        AI가 사건을 추론하고 있습니다
                    </h3>
                    <p className={`${styles.muted} body2`}>최대 1~2분 걸릴 수 있습니다.</p>
                </div>
                <div className={styles.time}>
                    <span className={`${styles.muted} caption1`}>경과 시간</span>
                    <span className="title2 num">{formatElapsed(elapsed)}</span>
                </div>
            </header>
            <div className={styles.bar} aria-hidden="true">
                <span />
            </div>
            {/* 1분이 지나면 멈춘 것으로 오해하지 않도록 한 번 더 안내한다. 화면은 최대 2분까지 응답을 기다린다. */}
            {elapsed >= SLOW_NOTICE_SECONDS && (
                <p className={`${styles.slow} body2`} role="status">
                    1분이 지났습니다. 자료가 많으면 2분 가까이 걸릴 수 있으니 조금만 더 기다려 주세요.
                </p>
            )}
            <ol className={styles.steps}>
                {steps.map((step) => (
                    <li key={step.label} className={`${styles.step} ${styles[step.state]}`}>
                        <span className={styles.mark} aria-hidden="true">
                            {step.state === 'done' && <Icon name="check" size={14} strokeWidth={3} />}
                        </span>
                        <span className={styles.stepText}>
                            <b className="label">{step.label}</b>
                            <span className={`${styles.muted} caption1`}>{step.sub}</span>
                        </span>
                        <span className={`${styles.stepState} caption2`}>{STEP_STATE_LABEL[step.state]}</span>
                    </li>
                ))}
            </ol>
            <p className={`${styles.note} caption1`}>
                <Icon name="log" size={14} /> 이 화면을 떠나도 추론은 계속됩니다. AI 사건 추론 탭으로 돌아오면 결과를 볼 수 있습니다.
            </p>
        </section>
    );
}

// 결과가 들어갈 자리를 회색 뼈대로 먼저 보여 준다.
export function SkeletonDiagram() {
    return (
        <div className={styles.skelGrid} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <span key={index} className={styles.skel} />
            ))}
        </div>
    );
}

export function SkeletonHypotheses() {
    return (
        <div className={styles.skelList} aria-hidden="true">
            {[0, 1, 2].map((index) => (
                <div key={index} className={styles.skelHyp}>
                    <span className={`${styles.skel} ${styles.lineShort}`} />
                    <span className={`${styles.skel} ${styles.line}`} />
                    <span className={`${styles.skel} ${styles.lineMid}`} />
                    <span className={`${styles.skel} ${styles.chip}`} />
                </div>
            ))}
        </div>
    );
}
