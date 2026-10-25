import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router';
import { CASE_TYPE_LABEL, EVIDENCE_TYPE_LABEL, STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { formatDateTime, labelOf } from '../../utils/format';
import { useAiRun } from '../../store/aiInferenceStore';
import { formatElapsed, useElapsed } from '../../hooks/useElapsed';
import { buildBasisLookup } from '../../utils/hypothesis';
import Icon from '../../components/common/Icon';
import Tag from '../../components/common/Tag';
import StatusBadge from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { BasisChips, Confidence, SourceTag } from '../../components/board/HypothesisParts';
import { EvidenceFormModal, LogFormModal, WitnessFormModal } from '../../components/board/BoardModals';
import DetectiveSilhouette from '../../components/board/DetectiveSilhouette';
import styles from './Board.module.css';

const PREVIEW_COUNT = 4;
const TIMELINE_LIMIT = 8;

// 사건 타임라인: 발생 일시와 등록된 증거물 확보·수사 기록 일시를 시간순으로 잇는다.
function buildTimeline(board, logs) {
    const events = [
        { key: 'occurred', at: board.caseInfo.occurredAt, label: '사건 발생', source: '신고 내용', tone: 'occ' },
        ...board.evidences.map((item) => ({
            key: `e-${item.evidenceId}`,
            at: item.acquiredAt,
            label: item.evidenceName,
            source: '증거물 확보',
            tone: 'ev',
        })),
        ...logs.map((log) => ({ key: `l-${log.logId}`, at: log.investigatedAt, label: log.content, source: '수사 기록', tone: 'log' })),
    ];
    return events.filter((event) => event.at).sort((a, b) => a.at.localeCompare(b.at)).slice(0, TIMELINE_LIMIT);
}

function NavyCard({ title, actions, children }) {
    return (
        <section className={styles.nc}>
            <header className={`${styles.ncHead} ${styles.ncNavy}`}>
                <h2 className="title3">{title}</h2>
                <div className={styles.ncActions}>{actions}</div>
            </header>
            <div className={styles.ncBody}>{children}</div>
        </section>
    );
}

function ListCard({ icon, title, count, actions, children }) {
    return (
        <section className={styles.nc}>
            <header className={styles.ncHead}>
                <h2 className="title3">
                    <Icon name={icon} />
                    {title} <span className={`${styles.count} num`}>({count})</span>
                </h2>
                <div className={styles.ncActions}>{actions}</div>
            </header>
            <div className={styles.ncBody}>{children}</div>
        </section>
    );
}

// AI 추론 카드 아래 상태 문구. 추론 중이면 이동해도 된다는 안내, 마쳤으면 최근 분석 시각과 결과 위치를 알려 준다.
function AiRunStatus({ locked, run }) {
    const { analysis } = run;
    if (locked) {
        return '수사 종결된 사건은 AI 추론을 실행할 수 없습니다';
    }
    if (run.status === 'running') {
        return '다른 탭으로 이동해도 추론은 계속됩니다';
    }
    if (run.status === 'error') {
        return `AI 추론에 실패했습니다. ${run.error?.message ?? ''}`;
    }
    if (analysis) {
        return (
            <>
                최근 분석 <span className="num">{formatDateTime(analysis.at)}</span> · 결과 보기는 AI 사건 추론 탭
            </>
        );
    }
    return 'AI 결과는 참고용이며 채택은 담당 경찰이 결정합니다';
}

// 추론 중에는 버튼이 경과 시간을 보여 주고, 누르면 진행 화면이 있는 AI 사건 추론 탭으로 간다.
function AiRunButton({ locked, ai, onOpen }) {
    const elapsed = useElapsed(ai.run.startedAt, ai.running ? null : ai.run.finishedAt);
    if (ai.running) {
        return (
            <button type="button" className={`${styles.aiGo} title3`} onClick={onOpen}>
                <span className={styles.goSpin} aria-hidden="true" /> 추론 중 · <span className="num">{formatElapsed(elapsed)}</span>
            </button>
        );
    }
    return (
        <button type="button" className={`${styles.aiGo} title3`} disabled={locked} onClick={ai.start}>
            <Icon name="ai" size={17} /> AI 추론 실행
        </button>
    );
}

export default function BoardMainPage() {
    const navigate = useNavigate();
    const { caseId, board, logs, locked, officerName, reloadBoard } = useOutletContext();
    const ai = useAiRun(caseId);
    const [modal, setModal] = useState(null);
    const { caseInfo, latestHypothesis: hypothesis } = board;
    const statementCount = board.witnesses.reduce((sum, witness) => sum + witness.statementCount, 0);
    const base = `/board/${caseId}`;

    // 보드 요약의 근거 자료는 이름이 함께 오므로 그대로 조회표로 쓴다.
    const lookup = hypothesis
        ? buildBasisLookup(
              hypothesis.evidences.map((item) => ({ evidenceId: item.evidenceId, evidenceName: item.name, description: item.description })),
              hypothesis.statements.map((item) => ({ witnessId: item.statementId, name: item.witnessName, statements: [item] })),
              hypothesis.logs ?? []
          )
        : null;

    const saved = () => {
        setModal(null);
        reloadBoard();
    };

    const more = (total, to, unit) =>
        total > PREVIEW_COUNT && (
            <Link className={`${styles.moreBar} label`} to={to}>
                외 {total - PREVIEW_COUNT}
                {unit} 더 보기 ›
            </Link>
        );

    const addButton = (key, label = '+ 등록') => (
        <Button size="sm" onClick={() => setModal(key)} disabled={locked}>
            {label}
        </Button>
    );

    return (
        <>
            <div className={styles.g3}>
                <NavyCard
                    title="사건 개요"
                    actions={
                        <Link className={`${styles.ghostLight} caption2`} to={`/cases/${caseId}`}>
                            상세 보기
                        </Link>
                    }
                >
                    <div className={styles.overview}>
                        <span className={styles.pic} aria-hidden="true">
                            <Icon name="gem" size={40} />
                        </span>
                        <dl className="body2">
                            <dt>사건명</dt>
                            <dd>{caseInfo.title}</dd>
                            <dt>발생 일시</dt>
                            <dd className="num">{formatDateTime(caseInfo.occurredAt)}</dd>
                            <dt>발생 장소</dt>
                            <dd>{caseInfo.location}</dd>
                            <dt>사건 유형</dt>
                            <dd>{labelOf(CASE_TYPE_LABEL, caseInfo.caseType)}</dd>
                            <dt>상세 내용</dt>
                            <dd className={styles.ink2}>{caseInfo.description}</dd>
                        </dl>
                    </div>
                </NavyCard>

                <section className={styles.aiCta} aria-label="AI 사건 추론">
                    <DetectiveSilhouette className={styles.aiSilhouette} />
                    <div className={styles.aiCtaHead}>
                        <span className={styles.aiCtaIcon}>
                            <Icon name="brain" size={22} />
                        </span>
                        <h2 className="title1">AI 사건 추론</h2>
                    </div>
                    <p className="body1">
                        등록된 증거물과 목격자 진술을 바탕으로
                        <br />
                        수사 가설과 놓치기 쉬운 정황을 찾아 줍니다.
                    </p>
                    <div className={styles.aiStats}>
                        <span className="caption1">증거물 {board.totalEvidenceCount}건</span>
                        <span className="caption1">진술 {statementCount}건</span>
                        <span className="caption1">수사 기록 {board.totalInvestigationLogCount}건</span>
                    </div>
                    <AiRunButton locked={locked} ai={ai} onOpen={() => navigate(`${base}/ai`)} />
                    <p className={`${styles.aiLast} caption1`}>
                        <AiRunStatus locked={locked} run={ai.run} />
                    </p>
                </section>

                <NavyCard
                    title="수사 가설"
                    actions={
                        <Link className={`${styles.ghostLight} caption2`} to={`${base}/hypotheses`}>
                            자세히 보기
                        </Link>
                    }
                >
                    {hypothesis ? (
                        <div className={styles.hsum}>
                            <div className={styles.inline}>
                                <SourceTag source={hypothesis.source} />
                                <StatusBadge code="ADOPTED" labels={{ ADOPTED: '채택' }} tone="done" />
                                <Tag tone="gold">최근 채택</Tag>
                            </div>
                            <p className="title3">{hypothesis.content}</p>
                            <Confidence value={hypothesis.confidence} />
                            <p className={`${styles.muted} caption2`}>근거 자료</p>
                            <BasisChips
                                evidenceIds={hypothesis.evidences.map((item) => item.evidenceId)}
                                statementIds={hypothesis.statements.map((item) => item.statementId)}
                                logIds={(hypothesis.logs ?? []).map((item) => item.logId)}
                                circumstances={hypothesis.circumstances}
                                lookup={lookup}
                                limit={2}
                            />
                            <p className={`${styles.muted} caption1`}>
                                채택 {hypothesis.adoptedByName} · <span className="num">{formatDateTime(hypothesis.adoptedAt).slice(0, 10)}</span>
                            </p>
                        </div>
                    ) : (
                        <div className={styles.hempty}>
                            <p className="label">아직 채택한 수사 가설이 없습니다.</p>
                            <p className="caption1">AI 사건 추론에서 가설을 받아 하나를 채택하면 여기에 저장됩니다.</p>
                        </div>
                    )}
                </NavyCard>
            </div>

            <div className={styles.g3}>
                <ListCard
                    icon="evidence"
                    title="증거물"
                    count={board.totalEvidenceCount}
                    actions={
                        <>
                            {addButton('evidence')}
                            <Link className={`${styles.more} caption1`} to={`${base}/evidences`}>
                                전체보기 ›
                            </Link>
                        </>
                    }
                >
                    {board.evidences.length === 0 ? (
                        <p className={`${styles.muted} body2`}>등록된 증거물이 없습니다.</p>
                    ) : (
                        board.evidences.slice(0, PREVIEW_COUNT).map((item) => (
                            <div key={item.evidenceId} className={styles.erow}>
                                <span className={styles.thumb}>
                                    <Icon name={item.evidenceType} size={22} />
                                </span>
                                <div className={styles.rowBody}>
                                    <p className={`${styles.rowTitle} label`}>
                                        {item.evidenceName} <Tag tone="blue">{labelOf(EVIDENCE_TYPE_LABEL, item.evidenceType)}</Tag>
                                    </p>
                                    <p className={`${styles.muted} caption1`}>
                                        <span className="num">{formatDateTime(item.acquiredAt)}</span> · {item.acquiredLocation}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {more(board.totalEvidenceCount, `${base}/evidences`, '건')}
                </ListCard>

                <ListCard
                    icon="witness"
                    title="목격자 및 진술"
                    count={board.totalWitnessCount}
                    actions={
                        <>
                            {addButton('witness')}
                            <Link className={`${styles.more} caption1`} to={`${base}/witnesses`}>
                                전체보기 ›
                            </Link>
                        </>
                    }
                >
                    {board.witnesses.length === 0 ? (
                        <p className={`${styles.muted} body2`}>등록된 목격자가 없습니다.</p>
                    ) : (
                        board.witnesses.slice(0, PREVIEW_COUNT).map((witness) => (
                            <div key={witness.witnessId} className={styles.wrow}>
                                <span className={`${styles.avatar} title3`} aria-hidden="true">
                                    {witness.name[0]}
                                </span>
                                <div className={styles.rowBody}>
                                    <p className={`${styles.rowTitle} label`}>
                                        {witness.name} <Tag tone="blue">{witness.relationship}</Tag>
                                        <span className={`${styles.stCount} caption2`}>진술 {witness.statementCount}건</span>
                                    </p>
                                    <p className={`${styles.muted} caption1 num`}>{witness.phone}</p>
                                    {witness.latestStatementContent && (
                                        <p className={`${styles.ink2} caption1`}>
                                            {witness.latestStatementType !== 'INITIAL' && (
                                                <b className={styles.warnText}>{STATEMENT_TYPE_LABEL[witness.latestStatementType]} </b>
                                            )}
                                            {witness.latestStatementContent}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {more(board.totalWitnessCount, `${base}/witnesses`, '명')}
                </ListCard>

                <ListCard
                    icon="log"
                    title="수사 기록"
                    count={board.totalInvestigationLogCount}
                    actions={
                        <>
                            {addButton('log', '+ 작성')}
                            <Link className={`${styles.more} caption1`} to={`${base}/logs`}>
                                전체보기 ›
                            </Link>
                        </>
                    }
                >
                    {board.investigationLogs.length === 0 ? (
                        <p className={`${styles.muted} body2`}>등록된 수사 기록이 없습니다.</p>
                    ) : (
                        <ul className={styles.logList}>
                            {board.investigationLogs.slice(0, PREVIEW_COUNT).map((log) => (
                                <li key={log.logId}>
                                    <p className={`${styles.muted} caption1 num`}>{formatDateTime(log.investigatedAt)}</p>
                                    <p className={`${styles.clamp} label`}>{log.content}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    {more(board.totalInvestigationLogCount, `${base}/logs`, '건')}
                </ListCard>
            </div>

            <section className={styles.wideCard} aria-label="사건 타임라인">
                <header className={styles.ncHead}>
                    <h2 className="title3">
                        <Icon name="timeline" />
                        사건 타임라인
                    </h2>
                    <span className={`${styles.muted} caption1`}>발생 일시와 등록 자료 기준</span>
                </header>
                <ol className={styles.htl}>
                    {buildTimeline(board, logs).map((event) => (
                        <li key={event.key} className={`${styles.ev} ${styles[`ev_${event.tone}`]}`}>
                            <span className={styles.evIcon} aria-hidden="true">
                                <Icon name={event.tone === 'occ' ? 'warn' : event.tone === 'ev' ? 'evidence' : 'log'} />
                            </span>
                            <span className="num label">{formatDateTime(event.at).slice(5)}</span>
                            <span className={`${styles.evLabel} caption1`}>{event.label}</span>
                            <span className={`${styles.muted} caption1`}>({event.source})</span>
                        </li>
                    ))}
                </ol>
            </section>

            <EvidenceFormModal open={modal === 'evidence'} caseId={caseId} officerName={officerName} onClose={() => setModal(null)} onSaved={saved} />
            <WitnessFormModal open={modal === 'witness'} caseId={caseId} onClose={() => setModal(null)} onSaved={saved} />
            <LogFormModal open={modal === 'log'} caseId={caseId} officerName={officerName} onClose={() => setModal(null)} onSaved={saved} />
        </>
    );
}
