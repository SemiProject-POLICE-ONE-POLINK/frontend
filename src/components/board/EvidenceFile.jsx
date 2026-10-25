import Icon from '../common/Icon';
import styles from './EvidenceFile.module.css';

const FILE_KIND_LABEL = { 'application/pdf': 'PDF 문서', 'video/mp4': '영상' };
const EXTENSION = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf', 'video/mp4': 'mp4' };

// 카드 왼쪽 썸네일. 이미지면 사진을, 그 밖의 파일이나 첨부가 없으면 유형 아이콘을 보여 준다.
export function EvidenceThumb({ file, evidenceType, name }) {
    if (file?.status === 'done' && file.isImage) {
        return <img className={styles.img} src={file.url} alt={`${name} 첨부 이미지`} />;
    }
    return (
        <span className={styles.icon} aria-hidden="true">
            <Icon name={evidenceType} size={34} />
            {file?.status === 'loading' && <span className={styles.loading} />}
        </span>
    );
}

// 카드 아래 첨부 파일 줄. 이미지는 원본 보기, 그 밖의 파일은 다운로드를 제공한다.
export function EvidenceFileLine({ file, evidenceId }) {
    if (!file) {
        return <span>첨부 파일 없음</span>;
    }
    if (file.status === 'loading') {
        return <span role="status">첨부 파일을 불러오는 중입니다…</span>;
    }
    if (file.status === 'error') {
        return (
            <>
                <span className={styles.error}>첨부 파일을 불러오지 못했습니다.</span>
                <button type="button" className={`${styles.action} caption2`} onClick={file.retry}>
                    다시 시도
                </button>
            </>
        );
    }
    const label = file.isImage ? '이미지' : (FILE_KIND_LABEL[file.type] ?? '파일');
    return (
        <>
            <span>첨부 파일 · {label}</span>
            {file.isImage ? (
                <a className={`${styles.action} caption2`} href={file.url} target="_blank" rel="noreferrer">
                    원본 보기
                </a>
            ) : (
                <a className={`${styles.action} caption2`} href={file.url} download={`${evidenceId}.${EXTENSION[file.type] ?? 'bin'}`}>
                    다운로드
                </a>
            )}
        </>
    );
}
