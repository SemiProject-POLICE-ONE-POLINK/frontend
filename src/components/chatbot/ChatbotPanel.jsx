import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { findItemMatches, getItems, getMyItems, previewItemMatches } from '../../api/items';
import { useAsync } from '../../hooks/useAsync';
import { useChatStore } from '../../store/chatStore';
import { ITEM_CATEGORY_LABEL, ITEM_STATUS, ITEM_TYPE } from '../../constants/codes';
import { formatDate, labelOf } from '../../utils/format';
import { detectCategory, detectDate, detectFeatureTerms, detectPlace } from '../../utils/chatParser';
import Icon, { Emblem } from '../common/Icon';
import ItemFormModal from '../items/ItemFormModal';
import styles from './ChatbotPanel.module.css';

const CANDIDATE_LIMIT = 4;
const GREETING = {
    id: 0,
    from: 'bot',
    kind: 'text',
    text: '안녕하세요, 분실물 찾기 도우미예요. 잃어버린 물건을 편하게 설명해 주세요. 보관 중인 습득물과 비교해 비슷한 물품을 찾아 드릴게요.',
    hint: '예: 어제 청솔역 근처에서 분홍색 휴대폰을 잃어버렸어요. 토끼 스트랩이 달려 있어요.',
};
const EMPTY_CONTEXT = { text: '', category: null, word: null, date: null, place: null, featureTerms: [], askedCategory: false };

const loadLostItems = () =>
    getMyItems({ page: 0, size: 50 }).then((response) =>
        (response.items ?? []).filter((item) => item.itemType === ITEM_TYPE.LOST && item.status === ITEM_STATUS.LOST)
    );

// AI 분실물 챗봇 패널(CIT-008). 설명에서 뽑은 조건으로 보관 중 습득물을 조회하고,
// 실제 AI 일치도는 등록된 분실물 번호로 서버 매칭(POST /api/v1/ai/item-matches)을 호출해 보여 준다.
export default function ChatbotPanel() {
    const open = useChatStore((state) => state.open);
    const toggle = useChatStore((state) => state.toggle);
    const setOpen = useChatStore((state) => state.setOpen);
    
    const lostItems = useAsync(loadLostItems);
    const nextId = useRef(1);
    const logRef = useRef(null);
    const requestLocked = useRef(false);
    const [messages, setMessages] = useState([GREETING]);
    const [context, setContext] = useState(EMPTY_CONTEXT);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [registerDraft, setRegisterDraft] = useState(null);

    useEffect(() => {
        logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight });
    }, [messages, open]);

    const push = (message) => {
        const id = nextId.current;
        nextId.current += 1;
        setMessages((prev) => [...prev, { id, ...message }]);
        return id;
    };

    const replace = (id, message) => setMessages((prev) => prev.map((item) => (item.id === id ? { id, ...message } : item)));

    const beginRequest = () => {
        if (requestLocked.current) {
            return false;
        }
        requestLocked.current = true;
        setBusy(true);
        return true;
    };

    const finishRequest = () => {
        requestLocked.current = false;
        setBusy(false);
    };

    const reset = () => {
        setMessages([GREETING]);
        setContext(EMPTY_CONTEXT);
        setInput('');
    };

    const runAiMatch = async (lostItem) => {
        if (!beginRequest()) {
            return;
        }
        push({ from: 'me', kind: 'text', text: `${lostItem.itemId} ${lostItem.itemName}(으)로 찾아 주세요` });
        const pendingId = push({ from: 'bot', kind: 'typing' });
        try {
            const result = await findItemMatches(lostItem.itemId);
            replace(pendingId, { from: 'bot', kind: 'matches', lostItemId: lostItem.itemId, matches: result.matches ?? [] });
        } catch (error) {
            replace(pendingId, { from: 'bot', kind: 'text', tone: 'error', text: error.message });
        } finally {
            finishRequest();
        }
    };

    const searchByDescription = async (nextContext) => {
        const pendingId = push({ from: 'bot', kind: 'typing' });
        try {
            const [response, preview] = await Promise.all([
                getItems({
                    itemType: ITEM_TYPE.FOUND,
                    status: ITEM_STATUS.STORED,
                    category: nextContext.category,
                    location: nextContext.place,
                    startDate: nextContext.date,
                    endDate: nextContext.date,
                    page: 0,
                    size: 100,
                }),
                previewItemMatches({
                    itemName: nextContext.word ?? '분실물',
                    category: nextContext.category,
                    description: nextContext.text,
                    location: nextContext.place,
                    occurredAt: nextContext.date,
                }),
            ]);
            const candidates = (response.items ?? []).filter((item) => {
                const searchable = `${item.itemName} ${item.description}`.toLowerCase();
                const nameMatches = !nextContext.word || searchable.includes(nextContext.word.toLowerCase());
                const featuresMatch = (nextContext.featureTerms ?? []).every((term) => searchable.includes(term.toLowerCase()));
                return nameMatches && featuresMatch;
            });
            replace(pendingId, {
                from: 'bot',
                kind: 'candidates',
                context: nextContext,
                items: candidates.slice(0, CANDIDATE_LIMIT),
                total: candidates.length,
                matches: preview.matches ?? [],
            });
        } catch (error) {
            replace(pendingId, { from: 'bot', kind: 'text', tone: 'error', text: error.message });
        }
    };

    const handleDescription = async (text) => {
        if (!beginRequest()) {
            return;
        }
        const detected = detectCategory(text);
        const detectedDate = detectDate(text) ?? context.date;
        const detectedPlace = detectPlace(text) ?? context.place;
        const detectedWord = context.word ?? detected?.word ?? null;
        const detectedFeatures = detectFeatureTerms(text, { word: detectedWord, place: detectedPlace });
        const nextContext = {
            ...context,
            text: `${context.text} ${text}`.trim(),
            category: context.category ?? detected?.category ?? null,
            word: detectedWord,
            date: detectedDate,
            place: detectedPlace,
            featureTerms: [...new Set([...(context.featureTerms ?? []), ...detectedFeatures])],
        };
        push({ from: 'me', kind: 'text', text });
        if (!nextContext.category && !nextContext.askedCategory) {
            nextContext.askedCategory = true;
            setContext(nextContext);
            push({ from: 'bot', kind: 'askCategory', text: '어떤 종류의 물건인가요? 아래에서 고르거나 직접 적어 주세요.' });
            finishRequest();
            return;
        }
        setContext(nextContext);
        try {
            await searchByDescription(nextContext);
        } finally {
            finishRequest();
        }
    };

    const chooseCategory = async (code) => {
        if (!beginRequest()) {
            return;
        }
        const nextContext = { ...context, category: code };
        push({ from: 'me', kind: 'text', text: ITEM_CATEGORY_LABEL[code] });
        setContext(nextContext);
        try {
            await searchByDescription(nextContext);
        } finally {
            finishRequest();
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const text = input.trim();
        if (!text || busy) {
            return;
        }
        setInput('');
        handleDescription(text);
    };

    const openRegister = () => {
        setRegisterDraft({
            itemName: context.word ?? '',
            category: context.category ?? '',
            occurredAt: context.date ?? '',
            location: context.place ?? '',
            description: context.text,
        });
    };

    const handleRegistered = (result) => {
        setRegisterDraft(null);
        lostItems.reload();
        push({ from: 'bot', kind: 'text', text: `분실물 ${result.itemId}(으)로 등록했어요. 이 분실물로 AI 매칭을 진행할게요.` });
        runAiMatch({ itemId: result.itemId, itemName: result.itemName });
    };

    return (
        <>
            {open && (
                <section className={styles.panel} role="dialog" aria-label="AI 분실물 챗봇">
                    <header className={styles.head}>
                        <Emblem size={26} />
                        <div>
                            <b className="label">AI 분실물 챗봇</b>
                            <small className="caption1">설명만 하면 보관 중인 습득물을 찾아 드려요</small>
                        </div>
                        <button type="button" className={`${styles.headButton} caption2`} onClick={reset}>
                            새 대화
                        </button>
                    </header>
                    <div ref={logRef} className={styles.log} role="log" aria-live="polite">
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                onChooseCategory={chooseCategory}
                                onRegister={openRegister}
                                onReset={reset}
                                onNavigate={() => window.innerWidth < 700 && setOpen(false)}
                                busy={busy}
                            />
                        ))}
                        {messages.length === 1 && (lostItems.data ?? []).length > 0 && (
                            <div className={styles.chips}>
                                <p className={`${styles.chipTitle} caption2`}>등록한 분실물로 찾기</p>
                                {lostItems.data.map((item) => (
                                    <button key={item.itemId} type="button" className="caption2" disabled={busy} onClick={() => runAiMatch(item)}>
                                        {item.itemName}
                                    </button>
                                ))}
                            </div>
                        )}
                        {lostItems.error && (
                            <p className={`${styles.loadError} caption1`} role="alert">
                                등록한 분실물 목록을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
                            </p>
                        )}
                    </div>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <input
                            className="body2"
                            aria-label="잃어버린 물건 설명"
                            placeholder="잃어버린 물건을 설명해 주세요"
                            value={input}
                            disabled={busy}
                            onChange={(event) => setInput(event.target.value)}
                        />
                        <button type="submit" className={`${styles.send} label`} disabled={busy || !input.trim()}>
                            보내기
                        </button>
                    </form>
                </section>
            )}
            <button type="button" className={`${styles.fab} label`} onClick={toggle} aria-expanded={open}>
                <Icon name="ai" size={18} />
                {open ? '챗봇 닫기' : 'AI 분실물 챗봇'}
            </button>
            {registerDraft && (
                <ItemFormModal open itemType={ITEM_TYPE.LOST} initial={registerDraft} onClose={() => setRegisterDraft(null)} onSaved={handleRegistered} />
            )}
        </>
    );
}

function ChatMessage({ message, onChooseCategory, onRegister, onReset, onNavigate, busy }) {
    if (message.kind === 'typing') {
        return (
            <div className={`${styles.msg} ${styles.bot}`} aria-label="답변 작성 중">
                <span className={styles.typing}>
                    <i />
                    <i />
                    <i />
                </span>
            </div>
        );
    }
    if (message.from === 'me') {
        return <div className={`${styles.msg} ${styles.me} body2`}>{message.text}</div>;
    }
    return (
        <div className={`${styles.msg} ${styles.bot} ${message.tone === 'error' ? styles.error : ''} body2`}>
            {message.kind === 'text' && (
                <>
                    {message.text}
                    {message.hint && <p className={`${styles.muted} caption1`}>{message.hint}</p>}
                </>
            )}
            {message.kind === 'askCategory' && (
                <>
                    {message.text}
                    <div className={styles.chips}>
                        {Object.entries(ITEM_CATEGORY_LABEL).map(([code, label]) => (
                            <button key={code} type="button" className="caption2" disabled={busy} onClick={() => onChooseCategory(code)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}
            {message.kind === 'candidates' && (
                <CandidateList message={message} onRegister={onRegister} onReset={onReset} onNavigate={onNavigate} busy={busy} />
            )}
            {message.kind === 'matches' && <MatchList message={message} onNavigate={onNavigate} />}
        </div>
    );
}

function CandidateList({ message, onRegister, onReset, onNavigate, busy }) {
    const { context, items, total, matches = [] } = message;
    const matchesByItemId = new Map(matches.map((match) => [match.foundItemId, match]));
    return (
        <>
            설명하신 내용을 이렇게 이해했어요.
            <div className={styles.slots}>
                <span className="caption2">종류: {labelOf(ITEM_CATEGORY_LABEL, context.category) === '-' ? '모름' : labelOf(ITEM_CATEGORY_LABEL, context.category)}</span>
                <span className="caption2">물품명: {context.word ?? '미입력'}</span>
                <span className="caption2">특징: {context.featureTerms?.length ? context.featureTerms.join(', ') : '미입력'}</span>
                <span className="caption2">장소: {context.place ?? '미입력'}</span>
                <span className="caption2">날짜: {context.date ?? '미입력'}</span>
            </div>
            {items.length > 0 ? (
                <>
                    <p>
                        입력한 조건과 일치하는 보관 중 습득물 <b>{total}건</b> 중 최근 {items.length}건이에요.
                    </p>
                    {items.map((item) => {
                        const match = matchesByItemId.get(item.itemId);
                        return (
                            <div key={item.itemId} className={styles.mrow}>
                                <Link className="label" to={`/items/${item.itemId}`} onClick={onNavigate}>
                                    {item.itemName}
                                </Link>{' '}
                                <span className={`${styles.code} num caption2`}>{item.itemId}</span>
                                <p className={`${styles.muted} caption1`}>
                                    {item.location} · <span className="num">{formatDate(item.occurredAt)}</span>
                                </p>
                                {match && <p className={`${styles.muted} caption1`}><b>{match.score}% 일치</b> · {match.reason}</p>}
                            </div>
                        );
                    })}
                </>
            ) : (
                <p>입력한 이름·특징·장소·날짜 조건에 맞는 보관 중 습득물이 없어요. 분실물로 등록해 두고 나중에 다시 찾아보세요.</p>
            )}
            {(!context.place || !context.date) && (
                <p className={`${styles.muted} caption1`}>
                    {[!context.place && '어디서', !context.date && '언제'].filter(Boolean).join(', ')} 잃어버렸는지 알려 주시면 더 정확해져요.
                </p>
            )}
            <div className={styles.chips}>
                <button type="button" className="caption2" disabled={busy} onClick={onRegister}>
                    이 내용으로 분실물 등록
                </button>
                <button type="button" className="caption2" disabled={busy} onClick={onReset}>
                    처음부터 다시
                </button>
            </div>
        </>
    );
}

function MatchList({ message, onNavigate }) {
    if (message.matches.length === 0) {
        return <>아직 비슷한 보관 중 습득물이 없어요. 새 습득물이 등록되면 다시 물어봐 주세요.</>;
    }
    return (
        <>
            보관 중인 습득물 중 <b>{message.matches.length}건</b>이 비슷해요.
            {message.matches.map((match) => (
                <div key={match.foundItemId} className={styles.match}>
                    <span className={`${styles.score} num`}>
                        {match.score}%<small className="micro">일치도</small>
                    </span>
                    <div>
                        <Link className="label" to={`/items/${match.foundItemId}`} onClick={onNavigate}>
                            {match.foundItemName}
                        </Link>{' '}
                        <span className={`${styles.code} num caption2`}>{match.foundItemId}</span>
                        <p className={`${styles.muted} caption1`}>
                            {match.foundItemLocation} · <span className="num">{formatDate(match.foundOccurredAt)}</span>
                        </p>
                        <p className={`${styles.muted} caption1`}>{match.reason}</p>
                    </div>
                </div>
            ))}
            <p className={`${styles.muted} caption1`}>AI 매칭만으로 소유자를 확정하지 않아요. 상세 화면에서 반환을 신청하면 경찰이 확인합니다.</p>
        </>
    );
}
