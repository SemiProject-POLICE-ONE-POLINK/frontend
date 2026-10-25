import { STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime } from '../../utils/format';
import styles from './BoardParts.module.css';

// 출처: AI 제안 / 직접 등록 (POL-014 ②)
export function SourceTag({ source }) {
    const isAi = !source || source === 'AI';
    return <span className={`${styles.source} ${isAi ? '' : styles.sourceManual} caption2`}>{isAi ? 'AI 제안' : '직접 등록'}</span>;
}

// 신뢰도는 근거 자료와의 부합 정도이며 확정 사실이 아니다. 값이 없으면 표시하지 않는다.
export function Confidence({ value }) {
    if (value === null || value === undefined) {
        return null;
    }
    const safe = Math.min(Math.max(Number(value) || 0, 0), 100);
    return (
        <div className={`${styles.confidence} caption1`}>
            <span>신뢰도</span>
            <span className={styles.meter} aria-hidden="true">
                <span className={styles.meterFill} style={{ width: `${safe}%` }} />
            </span>
            <b className="num body2">{safe}%</b>
        </div>
    );
}

// 근거 자료(증거물·진술·수사 기록 번호)와 정황 문장을 칩으로 보여 준다.
// 수사 기록은 경찰관의 조사 메모라 수사 일시와 내용을 함께 보여 준다.
export function BasisChips({ evidenceIds = [], statementIds = [], logIds = [], circumstances = [], lookup, limit }) {
    const chips = [
        ...evidenceIds.map((id) => {
            const evidence = lookup?.evidenceMap.get(id);
            return { key: `e-${id}`, kind: '증거물', cls: styles.kindEvidence, title: evidence?.evidenceName ?? id, text: evidence?.description };
        }),
        ...statementIds.map((id) => {
            const statement = lookup?.statementMap.get(id);
            return {
                key: `s-${id}`,
                kind: '진술',
                cls: styles.kindStatement,
                title: statement ? `${statement.witnessName} · ${STATEMENT_TYPE_LABEL[statement.statementType] ?? ''}` : `진술 #${id}`,
                text: statement?.content,
            };
        }),
        ...logIds.map((id) => {
            const log = lookup?.logMap?.get(id);
            return {
                key: `l-${id}`,
                kind: '수사 기록',
                cls: styles.kindLog,
                title: log ? formatDateTime(log.investigatedAt) : `수사 기록 #${id}`,
                text: log?.content,
            };
        }),
        ...circumstances.map((text) => ({ key: `c-${text}`, kind: '정황', cls: styles.kindEtc, text })),
    ];
    const shown = limit ? chips.slice(0, limit) : chips;

    if (chips.length === 0) {
        return <p className="caption1">연결된 근거 자료가 없습니다.</p>;
    }
    return (
        <div className={styles.basis}>
            {shown.map((chip) => (
                <div key={chip.key} className={`${styles.chip} body2`}>
                    <span className={`${styles.kind} ${chip.cls} micro`}>{chip.kind}</span>
                    <span className={styles.chipText}>
                        {chip.title && <b>{chip.title}</b>}
                        {chip.title && chip.text && ' · '}
                        {chip.text}
                    </span>
                </div>
            ))}
            {limit && chips.length > limit && <p className="caption1">외 {chips.length - limit}건</p>}
        </div>
    );
}
