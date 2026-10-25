import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { adoptHypothesis, getAdoptedHypotheses, getEvidences, getWitnesses } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { useSubmit } from '../../hooks/useSubmit';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, EVIDENCE_TYPE_LABEL, STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import { useAiRun } from '../../store/aiInferenceStore';
import { buildBasisLookup, toCheckItems } from '../../utils/hypothesis';
import Icon from '../../components/common/Icon';
import Tag from '../../components/common/Tag';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import Modal from '../../components/common/Modal';
import { BasisChips, Confidence } from '../../components/board/HypothesisParts';
import { EvidenceFormModal, LogFormModal, WitnessFormModal } from '../../components/board/BoardModals';
import { AiInferenceProgress, SkeletonDiagram, SkeletonHypotheses } from '../../components/board/AiInferenceProgress';
import styles from './Board.module.css';

const MAX_NODES = 6;
const PREVIEW_COUNT = 2;

// 목격자 요약은 최근 진술 순으로 보여 준다(POL-002 ⑦). 진술은 서버가 시간 오름차순으로 준다.
const byLatestStatement = (witnesses) =>
    [...witnesses].sort((a, b) => (b.statements.at(-1)?.createdAt ?? '').localeCompare(a.statements.at(-1)?.createdAt ?? ''));
const TAG_TONES = ['c1', 'c2', 'c3'];
// 한 번 분석에서 하나만 채택하므로, 채택 뒤 결정하지 않은 후보는 미채택으로 남는다. 기각·미채택은 저장하지 않는다.
const DECISION_TEXT = { 채택: '채택됨 · 수사 가설에 저장', 기각: '기각됨 · 저장하지 않음', 미채택: '미채택 · 저장하지 않음' };

const loadMaterials = (caseId) =>
    Promise.all([getEvidences(caseId), getWitnesses(caseId), getAdoptedHypotheses(caseId)]).then(([evidences, witnesses, adopted]) => ({
        evidences,
        witnesses,
        adopted,
    }));

// 관계도에서 자료와 가설의 관계. 일치는 가설을 지지하는 근거, 불일치는 AI가 가설과 어긋난다고 본 자료다.
// 불일치 번호(opposingEvidenceIds·opposingStatementIds)는 서버 응답에 포함된 경우에만 표시한다.
const RELATION = {
    support: { chip: '일치 가능성 높음', line: styles.lineBasis, edgeClass: styles.relEdgeSupport, chipClass: styles.relChipSupport },
    oppose: { chip: '확인 필요', line: styles.lineOppose, edgeClass: styles.relEdgeOppose, chipClass: styles.relChipOppose },
    related: { chip: '관련 가능성 있음', line: styles.lineRelated, chipClass: '' },
};

// 근거 선 위의 관계 이름은 자료 성격으로 정한다. 진술은 정정·추가 진술이 있으면 '진술 정정'으로 표시한다.
const EVIDENCE_EDGE = { VIDEO: '동선 일치', PHOTO: '흔적 일치', DOCUMENT: '처분 정황', SEIZED: '침입 흔적', ETC: '관련 정황' };

const relationOf = (supported, opposed) => {
    if (supported) {
        return 'support';
    }
    return opposed ? 'oppose' : 'related';
};

const edgeLabelOf = (node) => {
    if (node.relation === 'oppose') {
        return '불일치';
    }
    return node.relation === 'support' ? node.edge : '';
};

// 관계도 노드: 등록 순서(증거물 → 목격자)를 유지하고, 6개를 넘으면 근거·불일치 자료를 남기고 관련 자료를 줄인다(POL-010 처리 조건).
function buildNodes(materials, candidate) {
    const evidenceIds = new Set(candidate?.evidenceIds ?? []);
    const statementIds = new Set(candidate?.statementIds ?? []);
    const opposingEvidenceIds = new Set(candidate?.opposingEvidenceIds ?? []);
    const opposingStatementIds = new Set(candidate?.opposingStatementIds ?? []);
    const nodes = [
        ...materials.evidences.map((item) => ({
            id: item.evidenceId,
            name: item.evidenceName.replace(/\s*\(.+\)$/, ''),
            sub: [labelOf(EVIDENCE_TYPE_LABEL, item.evidenceType), item.description].filter(Boolean).join(' · '),
            icon: item.evidenceType,
            edge: EVIDENCE_EDGE[item.evidenceType] ?? '관련 정황',
            relation: relationOf(evidenceIds.has(item.evidenceId), opposingEvidenceIds.has(item.evidenceId)),
        })),
        ...materials.witnesses.map((witness) => ({
            id: witness.witnessId,
            name: `${witness.name} 진술`,
            sub: witness.relationship,
            person: witness.name[0],
            edge: witness.statements.some((statement) => statement.statementType !== 'INITIAL') ? '진술 정정' : '목격 일치',
            relation: relationOf(
                witness.statements.some((statement) => statementIds.has(statement.statementId)),
                witness.statements.some((statement) => opposingStatementIds.has(statement.statementId))
            ),
        })),
    ];
    const isKey = (node) => node.relation !== 'related';
    const relatedShown = nodes.filter((node) => !isKey(node)).slice(0, Math.max(0, MAX_NODES - nodes.filter(isKey).length));
    return nodes.filter((node) => isKey(node) || relatedShown.includes(node)).slice(0, MAX_NODES);
}

// 관계도 캔버스(px). 글자 크기는 그대로 두고 카드 너비에 맞춰 좌우 간격만 좁히며,
// MIN_CANVAS_WIDTH보다 좁을 때만 관계도 전체를 축소한다.
const CANVAS_HEIGHT = 640;
const MIN_CANVAS_WIDTH = 520;
const RADIUS_Y = 240;
const MAX_RADIUS_X = 240;
const CENTER_RADIUS = 94;
const NODE_HALF = { x: 70, y: 66 };

// 노드 수별 배치 각도(위에서 시계 방향). 4개 이하는 상하좌우에만 둬 선과 관계 이름이 가운데 원에 가려지지 않게 한다.
const LAYOUT_ANGLES = { 1: [-90], 2: [-90, 90], 3: [-90, 0, 180], 4: [-90, 0, 90, 180] };
const anglesFor = (count) => LAYOUT_ANGLES[count] ?? Array.from({ length: count }, (_, index) => -90 + (360 * index) / count);

// 관계 이름이 선 위에 들어가려면 원과 노드 사이에 이만큼의 빈 공간이 있어야 한다(글자 폭 + 앞뒤 여백).
const EDGE_LABEL_SPACE = 76;

// 선은 가운데에서 노드 상자 바로 앞까지 긋고, 관계 이름은 노드 쪽 선 끝 가까이에 둔다.
// 좌우 노드처럼 원과 노드 사이가 좁으면 이름이 원이나 노드에 겹치지 않도록 노드 바로 위에 둔다.
function placeNodes(nodes, canvasWidth) {
    const radiusX = Math.min(canvasWidth / 2 - NODE_HALF.x - 8, MAX_RADIUS_X);
    const angles = anglesFor(nodes.length);
    return nodes.map((node, index) => {
        const radian = (angles[index] * Math.PI) / 180;
        const dx = radiusX * Math.cos(radian);
        const dy = RADIUS_Y * Math.sin(radian);
        const distance = Math.hypot(dx, dy);
        const ux = dx / distance;
        const uy = dy / distance;
        const boxExit = Math.min(Math.abs(ux) > 1e-6 ? NODE_HALF.x / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? NODE_HALF.y / Math.abs(uy) : Infinity);
        const lineEnd = distance - boxExit - 4;
        const cx = canvasWidth / 2;
        const cy = CANVAS_HEIGHT / 2;
        const labelOnLine = lineEnd - CENTER_RADIUS >= EDGE_LABEL_SPACE;
        const labelAt = lineEnd - 12;
        return {
            ...node,
            x: cx + dx,
            y: cy + dy,
            lineEnd: { x: cx + ux * lineEnd, y: cy + uy * lineEnd },
            labelPoint: labelOnLine ? { x: cx + ux * labelAt, y: cy + uy * labelAt } : { x: cx + dx, y: cy + dy - NODE_HALF.y - 12 },
        };
    });
}

function useElementWidth(ref) {
    const [width, setWidth] = useState(null);
    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return undefined;
        }
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
    return width;
}

function RelationDiagram({ nodes: rawNodes, candidate, index, onOpenFull }) {
    const frameRef = useRef(null);
    const frameWidth = useElementWidth(frameRef) ?? MIN_CANVAS_WIDTH;
    const canvasWidth = Math.max(frameWidth, MIN_CANVAS_WIDTH);
    const scale = Math.min(1, frameWidth / MIN_CANVAS_WIDTH);
    const nodes = placeNodes(rawNodes, canvasWidth);
    const center = { x: canvasWidth / 2, y: CANVAS_HEIGHT / 2 };
    return (
        <div ref={frameRef} className={styles.rel} style={{ height: `${CANVAS_HEIGHT * scale}px` }}>
            <div
                className={styles.relCanvas}
                style={{ width: `${canvasWidth}px`, height: `${CANVAS_HEIGHT}px`, transform: `translateX(-50%) scale(${scale})` }}
            >
                <svg className={styles.relLines} aria-hidden="true">
                    {nodes.map((node) => (
                        <line key={node.id} x1={center.x} y1={center.y} x2={node.lineEnd.x} y2={node.lineEnd.y} className={RELATION[node.relation].line} />
                    ))}
                </svg>
                {nodes
                    .filter((node) => edgeLabelOf(node))
                    .map((node) => (
                        <span
                            key={`edge-${node.id}`}
                            className={`${styles.relEdge} ${RELATION[node.relation].edgeClass} caption2`}
                            style={{ left: `${node.labelPoint.x}px`, top: `${node.labelPoint.y}px` }}
                        >
                            {edgeLabelOf(node)}
                        </span>
                    ))}
                {/* 원 안에는 3줄까지만 보이므로, 눌러서 원본 가설 전체를 확인한다. */}
                <button type="button" className={styles.relCenter} onClick={onOpenFull} aria-label={`가설 ${index + 1} 전체 내용 보기`}>
                    <Icon name="witness" size={28} />
                    <span className={`${styles.relHead} caption2`}>
                        가설 {index + 1}
                        {candidate.confidence != null && ` · ${candidate.confidence}%`}
                    </span>
                    <span className={`${styles.relText} label`}>{candidate.content}</span>
                </button>
                {nodes.map((node) => (
                    <div key={node.id} className={styles.relNode} style={{ left: `${node.x}px`, top: `${node.y}px` }}>
                        {node.person ? (
                            <span className={`${styles.relTile} ${styles.relPerson} title3`}>{node.person}</span>
                        ) : (
                            <span className={styles.relTile}>
                                <Icon name={node.icon} size={24} />
                            </span>
                        )}
                        <span className={`${styles.relName} body1`} title={node.name}>
                            {node.name}
                        </span>
                        {node.sub && (
                            <span className={`${styles.relSub} caption1`} title={node.sub}>
                                {node.sub}
                            </span>
                        )}
                        <span className={`${styles.relChip} ${RELATION[node.relation].chipClass} caption2`}>{RELATION[node.relation].chip}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 서버는 추론 후보를 15분만 보관한다. 새로고침으로 결과를 다시 보여 줘도 그 뒤에는 채택 요청이 실패하므로 미리 막고 안내한다.
const CANDIDATE_TTL_MS = 15 * 60 * 1000;

function useCandidatesExpired(createdMs) {
    const [expiredFor, setExpiredFor] = useState(null);
    useEffect(() => {
        if (!createdMs) {
            return undefined;
        }
        const timer = setTimeout(() => setExpiredFor(createdMs), Math.max(0, createdMs + CANDIDATE_TTL_MS - Date.now()));
        return () => clearTimeout(timer);
    }, [createdMs]);
    return Boolean(createdMs) && expiredFor === createdMs;
}

export default function AiInferencePage() {
    const { caseId, board, logs, locked, officerName, reloadBoard } = useOutletContext();
    const loader = useCallback(() => loadMaterials(caseId), [caseId]);
    const materials = useAsync(loader);
    const adopt = useSubmit();
    const [modal, setModal] = useState(null);
    const [notice, setNotice] = useState('');
    const [fullOpen, setFullOpen] = useState(false);
    // 추론 요청·결과는 화면을 떠나도 이어지도록 스토어가 들고 있다.
    const ai = useAiRun(caseId);
    const { run: aiRun, running, setAnalysis, setChecked, markSeen } = ai;
    const { analysis, checked } = aiRun;
    const runError = aiRun.status === 'error' ? aiRun.error : null;
    const expired = useCandidatesExpired(analysis?.createdMs);
    // 서버가 후보를 찾지 못했거나(404) 이미 채택된 분석이라고 답하면(409) 이 결과로는 더 채택하지 않는다.
    // 브라우저에 남은 결과만 보고 채택 가능하다고 판단하지 않도록 새로고침 후에도 유지한다.
    const unavailable = analysis?.unavailable ?? null;
    const adoptBlocked = expired || Boolean(unavailable);
    const adoptDone = Boolean(analysis?.adoptedId);

    const run = () => {
        setNotice('');
        ai.start();
    };

    // 이 탭에서 결과를 봤으면 탭의 "새 결과" 표시를 지운다.
    useEffect(() => {
        if (aiRun.unseen) {
            markSeen();
        }
    }, [aiRun.unseen, markSeen]);

    const data = materials.data;
    const lookup = data ? buildBasisLookup(data.evidences, data.witnesses) : null;
    const adoptedContents = new Set((data?.adopted ?? []).map((item) => item.content));
    const statementTotal = (data?.witnesses ?? []).reduce((sum, witness) => sum + witness.statements.length, 0);
    const focused = analysis?.candidates[analysis.focus];

    const decide = async (candidate, index, decision) => {
        if (decision === '기각') {
            // 기각은 저장하지 않는다(POL-010 ④).
            setAnalysis((prev) => ({ ...prev, decisions: { ...prev.decisions, [index]: '기각' } }));
            return;
        }
        if (adoptBlocked) {
            return;
        }
        const result = await adopt.submit(async () => {
            try {
                return await adoptHypothesis(caseId, candidate.candidateId);
            } catch (error) {
                if (error.status === 404 || error.status === 409) {
                    setAnalysis((prev) => ({ ...prev, unavailable: { status: error.status, message: error.message } }));
                }
                throw error;
            }
        });
        if (result) {
            setAnalysis((prev) => ({ ...prev, focus: index, adoptedId: candidate.candidateId, decisions: { ...prev.decisions, [index]: '채택' } }));
            setNotice(`가설 ${index + 1}을(를) 채택해 수사 가설에 저장했습니다.`);
            materials.reload();
            reloadBoard();
        }
    };

    const saved = () => {
        setModal(null);
        materials.reload();
        reloadBoard();
    };

    // 왼쪽 자료 카드는 분석 화면을 가리지 않도록 2건만 보여 주고, 전체 목록은 카드 오른쪽 위 링크로 각 탭에서 본다.
    const allLink = (tab) => (
        <Link className={`${styles.more} caption1`} to={`/board/${caseId}/${tab}`}>
            전체보기 ›
        </Link>
    );

    if (materials.loading && !data) {
        return <LoadingState />;
    }

    return (
        <>
            <div className={styles.aiTop}>
                <div>
                    <h2 className="title1">AI 사건 추론 수사 보드</h2>
                    <p className={`${styles.ink2} body2`}>
                        등록된 증거와 진술을 기반으로 사건의 가능한 가설을 분석합니다. 가설은 검토용 제안이며 한 번 분석할 때 하나만 채택할 수 있습니다.
                    </p>
                </div>
                <dl className={`${styles.sumbox} caption1`}>
                    <div>
                        <dt>사건번호</dt>
                        <dd className="num label">{caseId}</dd>
                    </div>
                    <div>
                        <dt>발생일시</dt>
                        <dd className="num label">{formatDateTime(board.caseInfo.occurredAt)}</dd>
                    </div>
                    <div>
                        <dt>진행상태</dt>
                        <dd>
                            <StatusBadge code={board.caseInfo.status} labels={CASE_STATUS_LABEL} />
                        </dd>
                    </div>
                </dl>
            </div>
            <ErrorState error={materials.error} onRetry={materials.reload} />
            {notice && <Alert tone="success">{notice}</Alert>}

            {data && (
                <div className={styles.gai}>
                    <div className={styles.col}>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn1} caption2`}>1</span>
                                <h3 className="title3">사건 개요</h3>
                            </header>
                            <dl className={`${styles.miniDl} caption1`}>
                                <dt>유형</dt>
                                <dd>{labelOf(CASE_TYPE_LABEL, board.caseInfo.caseType)}</dd>
                                <dt>장소</dt>
                                <dd>{board.caseInfo.location}</dd>
                                <dt>내용</dt>
                                <dd>{board.caseInfo.description}</dd>
                            </dl>
                        </section>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn2} caption2`}>2</span>
                                <h3 className="title3">
                                    증거물 <span className={`${styles.count} num`}>({data.evidences.length})</span>
                                </h3>
                                <div className={styles.ncActions}>
                                    <Button size="sm" disabled={locked} onClick={() => setModal('evidence')}>
                                        + 등록
                                    </Button>
                                    {allLink('evidences')}
                                </div>
                            </header>
                            <div className={styles.ncBody}>
                                {data.evidences.length === 0 && <p className={`${styles.muted} body2`}>등록된 증거물이 없습니다.</p>}
                                {data.evidences.slice(0, PREVIEW_COUNT).map((item) => (
                                    <div key={item.evidenceId} className={styles.erow}>
                                        <span className={styles.thumb}>
                                            <Icon name={item.evidenceType} size={20} />
                                        </span>
                                        <div className={styles.rowBody}>
                                            <p className="label">{item.evidenceName}</p>
                                            <p className={`${styles.muted} ${styles.clamp} caption1`}>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn3} caption2`}>3</span>
                                <h3 className="title3">
                                    목격자 진술 <span className={`${styles.count} num`}>({data.witnesses.length})</span>
                                </h3>
                                <div className={styles.ncActions}>
                                    <Button size="sm" disabled={locked} onClick={() => setModal('witness')}>
                                        + 등록
                                    </Button>
                                    {allLink('witnesses')}
                                </div>
                            </header>
                            <div className={styles.ncBody}>
                                {data.witnesses.length === 0 && <p className={`${styles.muted} body2`}>등록된 목격자가 없습니다.</p>}
                                {byLatestStatement(data.witnesses)
                                    .slice(0, PREVIEW_COUNT)
                                    .map((witness) => {
                                        const latest = witness.statements.at(-1);
                                        return (
                                            <div key={witness.witnessId} className={styles.quote}>
                                                <p className="label">
                                                    {witness.name} <span className={`${styles.muted} caption1`}>({witness.relationship})</span>
                                                    <span className={`${styles.stCount} caption2`}>진술 {witness.statements.length}건</span>
                                                </p>
                                                {latest && (
                                                    <>
                                                        <p className={`${styles.muted} caption1`}>
                                                            최근 {STATEMENT_TYPE_LABEL[latest.statementType]} 진술 ·{' '}
                                                            <span className="num">{formatDateTime(latest.createdAt)}</span>
                                                        </p>
                                                        <p
                                                            className={`${styles.quoteText} ${styles.clamp} ${latest.statementType !== 'INITIAL' ? styles.quoteFix : ''} body2`}
                                                        >
                                                            “{latest.content}”
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </section>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn4} caption2`}>4</span>
                                <h3 className="title3">
                                    수사 기록 <span className={`${styles.count} num`}>({logs.length})</span>
                                </h3>
                                <div className={styles.ncActions}>
                                    <Button size="sm" disabled={locked} onClick={() => setModal('log')}>
                                        + 작성
                                    </Button>
                                    {allLink('logs')}
                                </div>
                            </header>
                            <div className={styles.ncBody}>
                                {logs.length === 0 ? (
                                    <p className={`${styles.muted} body2`}>등록된 수사 기록이 없습니다.</p>
                                ) : (
                                    <ul className={styles.logList}>
                                        {logs.slice(0, PREVIEW_COUNT).map((log) => (
                                            <li key={log.logId}>
                                                <p className={`${styles.muted} caption1 num`}>{formatDateTime(log.investigatedAt)}</p>
                                                <p className={`${styles.clamp} label`}>{log.content}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className={styles.col}>
                        {running && (
                            <>
                                <AiInferenceProgress
                                    startedAt={aiRun.startedAt}
                                    evidenceCount={data.evidences.length}
                                    statementCount={statementTotal}
                                />
                                <section className={styles.nc}>
                                    <header className={styles.ncHead}>
                                        <span className={`${styles.sn} ${styles.sn5} caption2`}>5</span>
                                        <h3 className="title3">AI 분석 결과 (사건 관계도)</h3>
                                        <span className={`${styles.ncActions} ${styles.muted} caption1`}>추론 후 표시</span>
                                    </header>
                                    <div className={styles.ncBody}>
                                        <SkeletonDiagram />
                                    </div>
                                </section>
                            </>
                        )}
                        {!running && !analysis && (
                            <section className={styles.nc}>
                                <div className={styles.aiEmpty}>
                                    <span className={styles.aiEmptyIcon}>
                                        <Icon name="brain" size={28} />
                                    </span>
                                    <h3 className="title2">{locked ? 'AI 추론을 실행할 수 없습니다' : 'AI 추론을 실행하세요'}</h3>
                                    <p className="body2">
                                        {locked
                                            ? '수사 종결된 사건은 새 분석을 실행할 수 없습니다. 채택한 가설은 수사 가설 탭에서 조회할 수 있습니다.'
                                            : `증거물 ${data.evidences.length}건과 진술 ${statementTotal}건으로 사건 관계도와 주요 가설을 분석합니다.`}
                                    </p>
                                    <Button onClick={run} disabled={locked}>
                                        <Icon name="ai" size={15} /> AI 추론 실행
                                    </Button>
                                    <ErrorState error={runError} />
                                </div>
                            </section>
                        )}
                        {!running && analysis && (
                            <>
                                <ErrorState error={runError} />
                                {runError && (
                                    <Alert tone="info">
                                        다시 추론하지 못해 이전 추론 결과(<span className="num">{formatDateTime(analysis.at)}</span>)를 표시하고 있습니다.
                                    </Alert>
                                )}
                                <section className={styles.nc}>
                                    <header className={styles.ncHead}>
                                        <span className={`${styles.sn} ${styles.sn5} caption2`}>5</span>
                                        <h3 className="title3">AI 분석 결과 (사건 관계도)</h3>
                                    </header>
                                    <div className={styles.ncBody}>
                                        <RelationDiagram nodes={buildNodes(data, focused)} candidate={focused} index={analysis.focus} onOpenFull={() => setFullOpen(true)} />
                                        <p className={`${styles.legend} caption1`}>
                                            <span><span className={styles.legendBasis}>━</span> 가설 {analysis.focus + 1}의 근거</span>
                                            <span><span className={styles.legendOppose}>┅</span> AI가 찾은 불일치</span>
                                            <span><span className={styles.legendRel}>┅</span> 관련 자료</span>
                                            <span>가설 카드를 누르면 관계도가 바뀝니다</span>
                                        </p>
                                    </div>
                                </section>
                                <section className={styles.nc}>
                                    <header className={styles.ncHead}>
                                        <span className={`${styles.sn} ${styles.sn7} caption2`}>7</span>
                                        <h3 className="title3">정황 · 추가로 확인할 것</h3>
                                    </header>
                                    <div className={styles.ncBody}>
                                        {(focused.circumstances ?? []).length > 0 && (
                                            <ul className={styles.issues}>
                                                {focused.circumstances.map((text) => (
                                                    <li key={text} className="body2">
                                                        <b className={`${styles.warnText} caption2`}>● 정황</b>
                                                        <span>{text}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {toCheckItems(focused.additionalRecommendation).map((text) => {
                                            const key = `${analysis.focus}-${text}`;
                                            return (
                                                <label key={key} className={`${styles.check} body2`}>
                                                    <input type="checkbox" checked={Boolean(checked[key])} onChange={() => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))} />
                                                    <span>{text}</span>
                                                </label>
                                            );
                                        })}
                                        {!focused.additionalRecommendation && !(focused.circumstances ?? []).length && (
                                            <p className={`${styles.muted} body2`}>AI가 제안한 추가 확인 사항이 없습니다.</p>
                                        )}
                                        <p className={`${styles.muted} caption1`}>체크 표시는 이 화면에서만 유지되며 저장되지 않습니다.</p>
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    <div className={styles.col}>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn6} caption2`}>6</span>
                                <h3 className="title3">AI가 제시한 주요 가설</h3>
                                {analysis && !running && (
                                    <div className={styles.ncActions}>
                                        <Button size="sm" variant="secondary" onClick={run} disabled={locked}>
                                            다시 분석
                                        </Button>
                                    </div>
                                )}
                                {running && <span className={`${styles.ncActions} ${styles.muted} caption1`}>추론 후 표시</span>}
                            </header>
                            <div className={`${styles.ncBody} ${styles.hcards}`}>
                                {adopt.error && adopt.error.status !== 404 && adopt.error.status !== 409 && <ErrorState error={adopt.error} />}
                                {running && <SkeletonHypotheses />}
                                {!running && analysis && !adoptDone && unavailable && (
                                    <Alert tone="warn">
                                        {unavailable.status === 404
                                            ? '추론 후보가 만료되었거나 사용할 수 없습니다. 다시 추론해 주세요.'
                                            : `${unavailable.message} 다시 추론해 주세요.`}
                                    </Alert>
                                )}
                                {!running && analysis && !adoptDone && !unavailable && expired && (
                                    <Alert tone="warn">추론 후 15분이 지나 이 결과의 가설은 채택할 수 없습니다. 다시 추론해 주세요.</Alert>
                                )}
                                {!running && analysis?.candidates.length === 1 && (
                                    <Alert tone="info">자료가 부족해 가설 1개만 도출되었습니다. 증거물·진술을 보강한 뒤 다시 추론해 보세요.</Alert>
                                )}
                                {!running &&
                                    analysis?.candidates.map((candidate, index) => {
                                    const decision = analysis.decisions[index];
                                    const previously = adoptedContents.has(candidate.content) && decision !== '채택';
                                    // 채택이 끝났으면 같은 분석에서 결정하지 않은 후보는 미채택이다.
                                    const status = decision ?? (adoptDone ? '미채택' : null);
                                    return (
                                        <article
                                            key={candidate.candidateId}
                                            className={`${styles.hcard} ${index === analysis.focus ? styles.hcardFocus : ''} ${
                                                decision === '채택' ? styles.hcardAdopted : ''
                                            } ${decision === '기각' ? styles.hcardRejected : ''}`}
                                        >
                                            <button
                                                type="button"
                                                className={styles.hcardSelect}
                                                onClick={() => setAnalysis((prev) => ({ ...prev, focus: index }))}
                                                aria-pressed={index === analysis.focus}
                                                aria-label={`가설 ${index + 1} 관계도 보기`}
                                            />
                                            <div className={styles.hcardHead}>
                                                <span className={`${styles.htag} ${styles[TAG_TONES[index] ?? 'c3']} caption2`}>가설 {index + 1}</span>
                                                <span className="label">
                                                    {candidate.content}
                                                    {previously && <Tag tone="blue">이전에 채택</Tag>}
                                                    {analysis.round > 1 && !previously && <Tag tone="gold">새 가설</Tag>}
                                                </span>
                                            </div>
                                            <Confidence value={candidate.confidence} />
                                            <BasisChips
                                                evidenceIds={candidate.evidenceIds}
                                                statementIds={candidate.statementIds}
                                                lookup={lookup}
                                                limit={3}
                                            />
                                            {index === analysis.focus && candidate.reason && (
                                                <div className={styles.why}>
                                                    <b className="caption2">AI 분석 근거</b>
                                                    <p className="body2">{candidate.reason}</p>
                                                </div>
                                            )}
                                            <div className={styles.decide}>
                                                <Button
                                                    size="sm"
                                                    variant={decision === '채택' ? 'primary' : 'secondary'}
                                                    disabled={locked || adoptBlocked || adoptDone || Boolean(decision) || previously || adopt.submitting}
                                                    onClick={() => decide(candidate, index, '채택')}
                                                >
                                                    가설 채택
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={decision === '기각' ? 'dangerOutline' : 'secondary'}
                                                    disabled={locked || adoptDone || Boolean(decision) || adopt.submitting}
                                                    onClick={() => decide(candidate, index, '기각')}
                                                >
                                                    기각
                                                </Button>
                                            </div>
                                            {status && <p className={`${styles.muted} caption1`}>{DECISION_TEXT[status]}</p>}
                                        </article>
                                    );
                                })}
                                <p className={`${styles.muted} caption1`}>
                                    최대 3개의 주요 가설이 신뢰도가 높은 순으로 표시됩니다.
                                    <br />
                                    본 가설은 등록된 수사 자료를 바탕으로 생성한 참고 정보입니다.
                                    <br />
                                    사실관계와 근거의 타당성을 검토한 후 채택 여부를 판단해 주시기 바랍니다.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {focused && (
                <Modal open={fullOpen} title={`가설 ${analysis.focus + 1} 전체 내용`} onClose={() => setFullOpen(false)}>
                    {focused.confidence != null && <p className={`${styles.muted} caption1`}>신뢰도 {focused.confidence}%</p>}
                    <p className={`${styles.fullHypothesis} body1`}>{focused.content}</p>
                </Modal>
            )}
            <EvidenceFormModal open={modal === 'evidence'} caseId={caseId} officerName={officerName} onClose={() => setModal(null)} onSaved={saved} />
            <WitnessFormModal open={modal === 'witness'} caseId={caseId} onClose={() => setModal(null)} onSaved={saved} />
            <LogFormModal open={modal === 'log'} caseId={caseId} officerName={officerName} onClose={() => setModal(null)} onSaved={saved} />
        </>
    );
}
