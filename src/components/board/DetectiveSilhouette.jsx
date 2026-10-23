import styles from './DetectiveSilhouette.module.css';

// AI 사건 추론 카드 배경의 탐정 실루엣(장식용).
// 이미지는 모양(마스크)으로만 쓰고 색은 디자인 토큰으로 칠한다. 위치·투명도는 부모가 className으로 정한다.
export default function DetectiveSilhouette({ className = '' }) {
    return (
        <span className={className} aria-hidden="true">
            <span className={styles.shape} />
        </span>
    );
}
