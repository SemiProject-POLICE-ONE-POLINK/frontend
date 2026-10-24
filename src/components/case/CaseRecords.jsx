import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { getEvidences, getInvestigationLogs, getWitnesses } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { EVIDENCE_TYPE_LABEL, STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import Card from '../common/Card';
import Icon from '../common/Icon';
import Tag from '../common/Tag';
import { Button } from '../common/Button';
import { Alert, EmptyState, LoadingState } from '../common/Feedback';
import styles from './CaseRecords.module.css';

// 사건 상세(ADM-002)가 길어지지 않도록 처음 보이는 건수를 제한하고 나머지는 목록 안에서 스크롤로 본다.
const VISIBLE_EVIDENCES = 2;
const VISIBLE_STATEMENTS = 1;
const VISIBLE_LOGS = 7;

const STATEMENT_TONE = {
    INITIAL: styles.kFirst,
    ADDITIONAL: styles.kAdd,
    CORRECTION: styles.kFix,
    REVERSAL: styles.kRev,
};

// 항목 높이가 내용마다 달라 고정 높이 대신 visibleCount번째 항목의 아래 끝까지를 실제로 재서 잘라 낸다.
function ScrollList({ visibleCount, label, className = '', children }) {
    const listRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState(null);
    const total = Array.isArray(children) ? children.length : 1;
    const overflow = total > visibleCount;

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || !overflow) {
            setMaxHeight(null);
            return undefined;
        }
        const measure = () => {
            const last = list.children[visibleCount - 1];
            setMaxHeight(last.offsetTop + last.offsetHeight);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => observer.disconnect();
    }, [overflow, visibleCount, total]);

    return (
        <ol
            ref={listRef}
            className={`${styles.scroll} ${className}`}
            style={maxHeight ? { maxHeight } : undefined}
            aria-label={label}
            // 스크롤 영역도 키보드로 내릴 수 있게 포커스를 받는다.
            tabIndex={overflow ? 0 : undefined}
        >
            {children}
        </ol>
    );
}

// 403은 화면 이동 대신 해당 카드 안에서 서버 메시지만 보여 주고, 나머지 카드는 그대로 쓸 수 있게 한다.
function SectionState({ error, loading, hasData, onRetry, isEmpty, emptyTitle }) {
    if (error) {
        const denied = error.status === 403;
        return (
            <Alert tone={denied ? 'warn' : 'error'} title={denied ? '열람 권한 없음' : undefined}>
                <p>{error.message}</p>
                {!denied && (
                    <Button size="sm" variant="secondary" onClick={onRetry}>
                        다시 시도
                    </Button>
                )}
            </Alert>
        );
    }
    if (loading && !hasData) {
        return <LoadingState />;
    }
    if (isEmpty) {
        return <EmptyState title={emptyTitle} />;
    }
    return null;
}

// 담당이 아닌 경찰에게는 API를 부르지 않고 카드 자리만 남겨 열람 범위를 안내한다.
export function LockedCard({ title, children }) {
    return (
        <Card title={title}>
            <p className={`${styles.lockNote} body2`}>
                <Icon name="lock" size={14} />
                <span>{children}</span>
            </p>
        </Card>
    );
}

// 서버 DTO에는 취득자·작성자 이름이 없어, 담당 경찰 본인이 볼 때만 이름을 붙인다.
export function EvidenceCard({ caseId, officerName }) {
    const loader = useCallback(() => getEvidences(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);

    return (
        <Card title="증거물" subtitle={data ? `${data.length}건` : undefined}>
            <SectionState
                error={error}
                loading={loading}
                hasData={Boolean(data)}
                onRetry={reload}
                isEmpty={data?.length === 0}
                emptyTitle="등록된 증거물이 없습니다"
            />
            {data?.length > 0 && (
                <ScrollList visibleCount={VISIBLE_EVIDENCES} label="증거물 목록">
                    {data.map((item) => (
                        <li key={item.evidenceId} className={styles.row}>
                            <span className={`${styles.code} num caption2`}>{item.evidenceId}</span>
                            <div className={styles.body}>
                                <p className={`${styles.title} label`}>
                                    {item.evidenceName}
                                    <Tag>{labelOf(EVIDENCE_TYPE_LABEL, item.evidenceType)}</Tag>
                                </p>
                                <p className={`${styles.muted} caption1`}>
                                    <span className="num">{formatDateTime(item.acquiredAt)}</span> · {item.acquiredLocation}
                                    {officerName && ` · 취득 ${officerName}`}
                                </p>
                                {item.description && <p className={`${styles.ink2} caption1`}>{item.description}</p>}
                                {item.fileAttached && (
                                    <p className={`${styles.muted} caption1`}>
                                        <Icon name="clip" size={12} /> 첨부 파일 있음
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ScrollList>
            )}
        </Card>
    );
}

// 목격자별 진술을 한 줄씩 펼쳐, 첫 줄(첫 목격자의 최초 진술)만 보이고 이후 진술은 스크롤로 본다.
function toStatementRows(witnesses) {
    return witnesses.flatMap((witness) =>
        witness.statements.map((statement, index) => ({ witness, statement, first: index === 0 }))
    );
}

export function WitnessCard({ caseId }) {
    const loader = useCallback(() => getWitnesses(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);
    const rows = data ? toStatementRows(data) : [];

    return (
        <Card title="목격자 · 진술 이력" subtitle={data ? `${data.length}명` : undefined}>
            <SectionState
                error={error}
                loading={loading}
                hasData={Boolean(data)}
                onRetry={reload}
                isEmpty={data?.length === 0}
                emptyTitle="등록된 목격자가 없습니다"
            />
            {rows.length > 0 && (
                <ScrollList visibleCount={VISIBLE_STATEMENTS} label="목격자 진술 이력">
                    {rows.map(({ witness, statement, first }) => (
                        <li key={statement.statementId} className={first ? styles.witnessStart : styles.witnessNext}>
                            {first && (
                                <div className={styles.witnessHead}>
                                    <span className={`${styles.code} num caption2`}>{witness.witnessId}</span>
                                    <span className={`${styles.avatar} label`} aria-hidden="true">
                                        {witness.name[0]}
                                    </span>
                                    <p className="label">
                                        {witness.name}
                                        <span className={`${styles.muted} caption1`}>
                                            {' '}
                                            · {witness.relationship} · <span className="num">{witness.phone}</span>
                                        </span>
                                    </p>
                                </div>
                            )}
                            <div className={styles.stmt}>
                                <p className="caption1">
                                    <span className={`${styles.stmtKind} ${STATEMENT_TONE[statement.statementType] ?? ''} micro`}>
                                        {labelOf(STATEMENT_TYPE_LABEL, statement.statementType)}
                                    </span>
                                    <span className={`${styles.muted} num`}>{formatDateTime(statement.createdAt)}</span>
                                </p>
                                <p className={`${styles.content} body2`}>{statement.content}</p>
                            </div>
                        </li>
                    ))}
                </ScrollList>
            )}
        </Card>
    );
}

// 기록 DTO에는 작성자 회원 번호만 있다. 담당 경찰이 바뀐 사건은 이전 담당자의 기록도 섞이므로
// 현재 담당 경찰(officer)과 번호가 같은 기록에만 이름을 붙인다.
function writerOf(log, officer) {
    if (officer?.name && log.officerId === officer.id) {
        return officer.name;
    }
    return (
        <>
            담당 경찰 회원 번호 <span className="num">{log.officerId}</span>
        </>
    );
}

export function InvestigationLogCard({ caseId, officer }) {
    const loader = useCallback(() => getInvestigationLogs(caseId), [caseId]);
    const { data, error, loading, reload } = useAsync(loader);

    return (
        <Card title="수사 기록" subtitle={data ? `시간순 · ${data.length}건` : '시간순'}>
            <SectionState
                error={error}
                loading={loading}
                hasData={Boolean(data)}
                onRetry={reload}
                isEmpty={data?.length === 0}
                emptyTitle="수사 기록이 없습니다"
            />
            {data?.length > 0 && (
                <ScrollList visibleCount={VISIBLE_LOGS} label="수사 기록 목록" className={styles.timeline}>
                    {data.map((log) => (
                        <li key={log.logId}>
                            <p className={`${styles.muted} caption1`}>
                                <span className="num">{formatDateTime(log.investigatedAt)}</span> · {writerOf(log, officer)}
                            </p>
                            <p className={`${styles.content} label`}>{log.content}</p>
                        </li>
                    ))}
                </ScrollList>
            )}
        </Card>
    );
}
