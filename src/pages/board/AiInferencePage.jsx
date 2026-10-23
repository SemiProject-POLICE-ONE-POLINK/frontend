import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';
import { adoptHypothesis, generateHypotheses, getAdoptedHypotheses, getEvidences, getWitnesses } from '../../api/investigations';
import { useAsync } from '../../hooks/useAsync';
import { useSubmit } from '../../hooks/useSubmit';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, EVIDENCE_TYPE_LABEL, STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import { buildBasisLookup, toCheckItems } from '../../utils/hypothesis';
import Icon from '../../components/common/Icon';
import Tag from '../../components/common/Tag';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Alert, ErrorState, LoadingState } from '../../components/common/Feedback';
import { BasisChips, Confidence } from '../../components/board/HypothesisParts';
import { EvidenceFormModal, WitnessFormModal } from '../../components/board/BoardModals';
import styles from './Board.module.css';

const MAX_NODES = 6;
const TAG_TONES = ['c1', 'c2', 'c3'];

const loadMaterials = (caseId) =>
    Promise.all([getEvidences(caseId), getWitnesses(caseId), getAdoptedHypotheses(caseId)]).then(([evidences, witnesses, adopted]) => ({
        evidences,
        witnesses,
        adopted,
    }));

// 관계도 노드: 초점 가설의 근거 자료를 우선해 최대 6개만 표시한다(POL-010 처리 조건).
function buildNodes(materials, candidate) {
    const evidenceIds = new Set(candidate?.evidenceIds ?? []);
    const statementIds = new Set(candidate?.statementIds ?? []);
    const nodes = [
        ...materials.evidences.map((item) => ({
            id: item.evidenceId,
            name: item.evidenceName.replace(/\s*\(.+\)$/, ''),
            sub: labelOf(EVIDENCE_TYPE_LABEL, item.evidenceType),
            icon: item.evidenceType,
            basis: evidenceIds.has(item.evidenceId),
        })),
        ...materials.witnesses.map((witness) => ({
            id: witness.witnessId,
            name: `${witness.name} 진술`,
            sub: witness.relationship,
            person: witness.name[0],
            basis: witness.statements.some((statement) => statementIds.has(statement.statementId)),
        })),
    ];
    const ordered = [...nodes.filter((node) => node.basis), ...nodes.filter((node) => !node.basis)].slice(0, MAX_NODES);
    return ordered.map((node, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(ordered.length, 1);
        return { ...node, x: 50 + 37 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) };
    });
}

function RelationDiagram({ nodes, candidate, index }) {
    return (
        <div className={styles.rel}>
            <svg className={styles.relLines} aria-hidden="true">
                {nodes.map((node) => (
                    <line
                        key={node.id}
                        x1="50%"
                        y1="50%"
                        x2={`${50 + (node.x - 50) * 0.66}%`}
                        y2={`${50 + (node.y - 50) * 0.66}%`}
                        className={node.basis ? styles.lineBasis : styles.lineRelated}
                    />
                ))}
            </svg>
            <div className={styles.relCenter}>
                <Icon name="witness" size={26} />
                <span className="micro">
                    가설 {index + 1}
                    {candidate.confidence != null && ` · ${candidate.confidence}%`}
                </span>
                <span className="caption2">{candidate.content}</span>
            </div>
            {nodes.map((node) => (
                <div key={node.id} className={styles.relNode} style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                    {node.person ? (
                        <span className={`${styles.relTile} ${styles.relPerson} title3`}>{node.person}</span>
                    ) : (
                        <span className={styles.relTile}>
                            <Icon name={node.icon} size={24} />
                        </span>
                    )}
                    <span className={`${styles.relName} caption2`}>{node.name}</span>
                    <span className={`${styles.muted} micro`}>{node.sub}</span>
                    <span className={`${styles.relChip} ${node.basis ? styles.relChipBasis : ''} micro`}>{node.basis ? '근거 자료' : '관련 자료'}</span>
                </div>
            ))}
        </div>
    );
}

export default function AiInferencePage() {
    const { caseId, board, locked, officerName, reloadBoard } = useOutletContext();
    const location = useLocation();
    const navigate = useNavigate();
    const loader = useCallback(() => loadMaterials(caseId), [caseId]);
    const materials = useAsync(loader);
    const generate = useSubmit();
    const adopt = useSubmit();
    const [analysis, setAnalysis] = useState(null);
    const [checked, setChecked] = useState({});
    const [modal, setModal] = useState(null);
    const [notice, setNotice] = useState('');
    const autorunDone = useRef(false);

    const submitGenerate = generate.submit;
    const run = useCallback(async () => {
        setNotice('');
        const response = await submitGenerate(() => generateHypotheses(caseId));
        if (response) {
            const candidates = [...(response.hypotheses ?? [])].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
            setAnalysis((prev) => ({ round: (prev?.round ?? 0) + 1, candidates, focus: 0, decisions: {}, adoptedId: null }));
            setChecked({});
        }
    }, [caseId, submitGenerate]);

    // 수사 보드 메인의 "AI 추론 실행"으로 들어오면 한 번 바로 분석한다.
    useEffect(() => {
        if (location.state?.autorun && !autorunDone.current && !locked) {
            autorunDone.current = true;
            navigate(location.pathname, { replace: true, state: null });
            run();
        }
    }, [location.state, location.pathname, locked, navigate, run]);

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
        const result = await adopt.submit(() => adoptHypothesis(caseId, candidate.candidateId));
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
                                </div>
                            </header>
                            <div className={styles.ncBody}>
                                {data.evidences.map((item) => (
                                    <div key={item.evidenceId} className={styles.erow}>
                                        <span className={styles.thumb}>
                                            <Icon name={item.evidenceType} size={20} />
                                        </span>
                                        <div className={styles.rowBody}>
                                            <p className="label">{item.evidenceName}</p>
                                            <p className={`${styles.muted} caption1`}>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className={styles.nc}>
                            <header className={styles.ncHead}>
                                <span className={`${styles.sn} ${styles.sn3} caption2`}>3</span>
                                <h3 className="title3">
                                    목격자 진술 <span className={`${styles.count} num`}>({statementTotal})</span>
                                </h3>
                                <div className={styles.ncActions}>
                                    <Button size="sm" disabled={locked} onClick={() => setModal('witness')}>
                                        + 등록
                                    </Button>
                                </div>
                            </header>
                            <div className={styles.ncBody}>
                                {data.witnesses.flatMap((witness) =>
                                    witness.statements.map((statement) => (
                                        <div key={statement.statementId} className={styles.quote}>
                                            <p className="label">
                                                {witness.name} <span className={`${styles.muted} caption1`}>({witness.relationship})</span>
                                            </p>
                                            <p className={`${styles.muted} caption1`}>
                                                {STATEMENT_TYPE_LABEL[statement.statementType]} 진술 · <span className="num">{formatDateTime(statement.createdAt)}</span>
                                            </p>
                                            <p className={`${styles.quoteText} ${statement.statementType !== 'INITIAL' ? styles.quoteFix : ''} body2`}>
                                                “{statement.content}”
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className={styles.col}>
                        {!analysis ? (
                            <section className={styles.nc}>
                                <div className={styles.aiEmpty}>
                                    <span className={styles.aiEmptyIcon}>
                                        <Icon name="brain" size={28} />
                                    </span>
                                    <h3 className="title2">{locked ? 'AI 추론을 실행할 수 없습니다' : 'AI 분석을 실행하세요'}</h3>
                                    <p className="body2">
                                        {locked
                                            ? '수사 종결된 사건은 새 분석을 실행할 수 없습니다. 채택한 가설은 수사 가설 탭에서 조회할 수 있습니다.'
                                            : `증거물 ${data.evidences.length}건과 진술 ${statementTotal}건으로 사건 관계도와 주요 가설을 분석합니다.`}
                                    </p>
                                    <Button onClick={run} disabled={locked} loading={generate.submitting} loadingText="AI 분석 중…">
                                        <Icon name="ai" size={15} /> AI 추론 실행
                                    </Button>
                                    <ErrorState error={generate.error} />
                                </div>
                            </section>
                        ) : (
                            <>
                                <section className={styles.nc}>
                                    <header className={styles.ncHead}>
                                        <span className={`${styles.sn} ${styles.sn4} caption2`}>4</span>
                                        <h3 className="title3">AI 분석 결과 (사건 관계도)</h3>
                                    </header>
                                    <div className={styles.ncBody}>
                                        <RelationDiagram nodes={buildNodes(data, focused)} candidate={focused} index={analysis.focus} />
                                        <p className={`${styles.legend} caption1`}>
                                            <span className={styles.legendBasis}>━</span> 가설 {analysis.focus + 1}의 근거 · <span className={styles.legendRel}>┅</span> 관련
                                            자료 · 가설 카드를 누르면 관계도가 바뀝니다
                                        </p>
                                    </div>
                                </section>
                                <section className={styles.nc}>
                                    <header className={styles.ncHead}>
                                        <span className={`${styles.sn} ${styles.sn6} caption2`}>6</span>
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
                                <span className={`${styles.sn} ${styles.sn5} caption2`}>5</span>
                                <h3 className="title3">AI가 제시한 주요 가설</h3>
                                {analysis && (
                                    <div className={styles.ncActions}>
                                        <Button size="sm" variant="secondary" onClick={run} disabled={locked} loading={generate.submitting} loadingText="분석 중…">
                                            다시 분석
                                        </Button>
                                    </div>
                                )}
                            </header>
                            <div className={`${styles.ncBody} ${styles.hcards}`}>
                                <ErrorState error={adopt.error} />
                                {analysis && generate.error && <ErrorState error={generate.error} />}
                                {!analysis && <p className={`${styles.muted} body2`}>분석을 실행하면 가설 3개가 신뢰도 순으로 표시됩니다.</p>}
                                {analysis?.candidates.map((candidate, index) => {
                                    const decision = analysis.decisions[index];
                                    const previously = adoptedContents.has(candidate.content) && decision !== '채택';
                                    const otherAdopted = analysis.adoptedId && analysis.adoptedId !== candidate.candidateId;
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
                                                    disabled={locked || Boolean(decision) || previously || Boolean(otherAdopted) || adopt.submitting}
                                                    onClick={() => decide(candidate, index, '채택')}
                                                >
                                                    가설 채택
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={decision === '기각' ? 'dangerOutline' : 'secondary'}
                                                    disabled={locked || Boolean(decision)}
                                                    onClick={() => decide(candidate, index, '기각')}
                                                >
                                                    기각
                                                </Button>
                                            </div>
                                            {decision && (
                                                <p className={`${styles.muted} caption1`}>
                                                    {decision === '채택' ? '채택됨 · 수사 가설에 저장' : '기각됨 · 저장하지 않음'}
                                                </p>
                                            )}
                                        </article>
                                    );
                                })}
                                <p className={`${styles.muted} caption1`}>
                                    신뢰도는 근거 자료와의 부합 정도이며 확정된 사실이 아닙니다. 한 번 분석할 때마다 가설 하나를 채택할 수 있고, 채택한 가설은 수사 가설에
                                    누적 저장됩니다. 기각하거나 결정하지 않은 가설은 저장되지 않으며 결정은 취소할 수 없습니다.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            <EvidenceFormModal open={modal === 'evidence'} caseId={caseId} officerName={officerName} onClose={() => setModal(null)} onSaved={saved} />
            <WitnessFormModal open={modal === 'witness'} caseId={caseId} onClose={() => setModal(null)} onSaved={saved} />
        </>
    );
}
