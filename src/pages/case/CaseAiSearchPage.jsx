import { useState } from 'react';
import { useNavigate } from 'react-router';
import { searchSimilarCases } from '../../api/cases';
import { useSubmit } from '../../hooks/useSubmit';
import { CASE_TYPE_LABEL } from '../../constants/codes';
import { labelOf } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Tag from '../../components/common/Tag';
import Icon from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { AiNotice, EmptyState, ErrorState, LoadingState } from '../../components/common/Feedback';
import { Field, FormActions, Textarea } from '../../components/common/Form';
import { Columns, Stack } from '../../components/common/Layout';
import styles from './CasePage.module.css';

const SITUATION_MAX = 1000;
const SAMPLES = [
    '친구 SNS로 급하게 돈 빌려 달라는 메시지가 와서 송금했어요',
    '역 코인로커에 며칠째 가방이 있고 째깍 소리가 나요',
    '아이가 하교 시간이 한참 지났는데 연락이 안 돼요',
];

// 권장 대응은 줄 단위 문장으로 오므로 번호 목록으로 보여 준다.
function toSteps(text) {
    return String(text ?? '')
        .split(/\n+/)
        .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
        .filter(Boolean);
}

export default function CaseAiSearchPage() {
    const navigate = useNavigate();
    const [situation, setSituation] = useState('');
    const [result, setResult] = useState(null);
    const { submit, submitting, error } = useSubmit();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!situation.trim()) {
            return;
        }
        setResult(null);
        const response = await submit(() => searchSimilarCases(situation.trim()));
        if (response) {
            setResult({ input: situation.trim(), ...response });
        }
    };

    const goToCreate = () => {
        navigate('/cases/new', { state: { draft: { description: result.input, caseType: result.suggestedCaseType ?? '' } } });
    };

    const steps = toSteps(result?.recommendedAction);

    return (
        <>
            <PageHeader
                eyebrow="AI · 참고용"
                title="AI 유사 사건 찾기"
                description="상황을 입력하면 과거 사례에서 비슷한 범죄 유형과 대응 방법을 찾아 드립니다. 결과는 참고 자료이며 법적 판단이 아닙니다."
            />
            <Columns>
                <Card>
                    <form onSubmit={handleSubmit} noValidate>
                        <Stack gap={12}>
                            <Field label="상황" required hint={`${situation.length} / ${SITUATION_MAX}자`}>
                                {(props) => (
                                    <Textarea
                                        {...props}
                                        rows={7}
                                        maxLength={SITUATION_MAX}
                                        placeholder="예: 새벽에 가게 셔터가 뜯겨 있고 진열장 유리가 깨져 있었어요"
                                        value={situation}
                                        onChange={(event) => setSituation(event.target.value)}
                                    />
                                )}
                            </Field>
                            <div>
                                <p className={`${styles.muted} eyebrow`}>예시 문장</p>
                                <div className={styles.samples}>
                                    {SAMPLES.map((sample) => (
                                        <Button key={sample} size="sm" variant="secondary" onClick={() => setSituation(sample)}>
                                            {sample.slice(0, 18)}…
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </Stack>
                        <FormActions>
                            <Button type="submit" disabled={!situation.trim()} loading={submitting} loadingText="AI 분석 중…">
                                <Icon name="ai" size={15} /> 분석하기
                            </Button>
                        </FormActions>
                    </form>
                </Card>
                <Card title="분석 결과" actions={<span className={`${styles.aiChip} micro`}>AI 생성 · 참고용</span>}>
                    <ErrorState error={error} />
                    {submitting && <LoadingState text="AI가 입력 내용을 분석하고 있습니다…" />}
                    {!submitting && !result && !error && <EmptyState title="분석 결과가 여기에 표시됩니다">왼쪽에 상황을 입력하고 분석을 눌러 주세요.</EmptyState>}
                    {result && (
                        <Stack gap={16}>
                            <AiNotice />
                            <div className={styles.result}>
                                <div>
                                    <div className={styles.resultHead}>
                                        <b className="title3">추천 유형</b>
                                        <Tag tone="blue">{labelOf(CASE_TYPE_LABEL, result.suggestedCaseType)}</Tag>
                                    </div>
                                    <p className={`${styles.ink2} body2`}>{result.analysis}</p>
                                    {steps.length > 0 && (
                                        <>
                                            <p className="label">대응 방법</p>
                                            <ol className={`${styles.steps} body2`}>
                                                {steps.map((step) => (
                                                    <li key={step}>{step}</li>
                                                ))}
                                            </ol>
                                        </>
                                    )}
                                </div>
                                <Button size="sm" variant="secondary" onClick={goToCreate}>
                                    이 유형으로 접수
                                </Button>
                            </div>
                            <div>
                                <p className="label">유사 사례</p>
                                {result.similarCases?.length ? (
                                    result.similarCases.map((item) => (
                                        <div key={item.caseId} className={styles.result}>
                                            <div>
                                                <div className={styles.resultHead}>
                                                    <b className="body2">{item.title}</b>
                                                    <Tag>{labelOf(CASE_TYPE_LABEL, item.caseType)}</Tag>
                                                </div>
                                                <p className={`${styles.muted} caption1`}>
                                                    참고 사례 <span className="num">{item.caseId}</span> · 일치 단서: {item.similarityReason}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState title="유사한 사례를 찾지 못했습니다">상황을 조금 더 구체적으로(장소, 피해 내용, 시간) 적어 보세요.</EmptyState>
                                )}
                            </div>
                        </Stack>
                    )}
                </Card>
            </Columns>
        </>
    );
}
