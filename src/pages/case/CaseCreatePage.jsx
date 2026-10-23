import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { createCase } from '../../api/cases';
import { useSubmit } from '../../hooks/useSubmit';
import { CASE_TYPE_LABEL } from '../../constants/codes';
import { nowDateTimeInput, toLocalDateTime } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { Button, ButtonLink } from '../../components/common/Button';
import { Alert, ErrorState } from '../../components/common/Feedback';
import { Field, FormActions, FormGrid, Input, Select, Textarea } from '../../components/common/Form';
import styles from './CasePage.module.css';

const TITLE_MAX = 100;
const LOCATION_MAX = 255;
const FIELDS = ['title', 'caseType', 'occurredAt', 'location', 'description'];

export default function CaseCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    // AI 유사 사건 찾기에서 넘어온 경우 상황 설명과 추천 유형을 초안으로 채운다(CIT-004 ⑥).
    const draft = location.state?.draft;
    const [form, setForm] = useState({
        title: '',
        caseType: draft?.caseType ?? '',
        description: draft?.description ?? '',
        occurredAt: '',
        location: '',
    });
    const [formError, setFormError] = useState('');
    const { submit, submitting, error } = useSubmit();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (FIELDS.some((key) => !String(form[key]).trim())) {
            setFormError('필수 정보가 누락되어 접수할 수 없습니다. 모든 항목을 입력해 주세요.');
            return;
        }
        if (form.occurredAt > nowDateTimeInput()) {
            setFormError('발생일시는 현재보다 미래일 수 없습니다.');
            return;
        }
        setFormError('');
        const result = await submit(() =>
            createCase({
                title: form.title.trim(),
                caseType: form.caseType,
                description: form.description.trim(),
                occurredAt: toLocalDateTime(form.occurredAt),
                location: form.location.trim(),
            })
        );
        if (result) {
            // 사건번호(SMPA-연도-일련번호)는 서버가 생성하고 접수 직후 상태는 대기 중이다.
            navigate(`/cases/${result.caseId}`, { replace: true, state: { created: true } });
        }
    };

    return (
        <>
            <PageHeader eyebrow="시민 신고" title="사건 접수" description="필수 항목을 모두 입력해야 접수됩니다. 사건번호는 접수 즉시 자동으로 생성됩니다." />
            {draft && <Alert tone="info">AI 유사 사건 찾기에서 입력한 상황과 추천 유형을 채웠습니다. 제출 전에 내용을 확인해 주세요.</Alert>}
            <div className={styles.layout}>
                <Card>
                    <form onSubmit={handleSubmit} noValidate>
                        <ErrorState error={error} />
                        <FormGrid>
                            <Field label="사건명" required className="span-all">
                                {(props) => (
                                    <Input {...props} name="title" maxLength={TITLE_MAX} placeholder="예: 베이커 공원 자전거 도난" value={form.title} onChange={handleChange} />
                                )}
                            </Field>
                            <Field label="사건유형" required>
                                {(props) => (
                                    <Select {...props} name="caseType" value={form.caseType} onChange={handleChange}>
                                        <option value="">선택하세요</option>
                                        {Object.entries(CASE_TYPE_LABEL).map(([code, label]) => (
                                            <option key={code} value={code}>
                                                {label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </Field>
                            <Field label="발생일시" required>
                                {(props) => (
                                    <Input {...props} type="datetime-local" name="occurredAt" max={nowDateTimeInput()} value={form.occurredAt} onChange={handleChange} />
                                )}
                            </Field>
                            <Field label="발생장소" required className="span-all">
                                {(props) => (
                                    <Input
                                        {...props}
                                        name="location"
                                        maxLength={LOCATION_MAX}
                                        placeholder="예: 베이커가 2가 공원 입구"
                                        value={form.location}
                                        onChange={handleChange}
                                    />
                                )}
                            </Field>
                            <Field label="신고내용" required className="span-all" error={formError}>
                                {(props) => (
                                    <Textarea
                                        {...props}
                                        name="description"
                                        rows={6}
                                        placeholder="언제, 어디서, 무슨 일이 있었는지 적어 주세요."
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                )}
                            </Field>
                        </FormGrid>
                        <FormActions>
                            <ButtonLink variant="secondary" to="/my">
                                취소
                            </ButtonLink>
                            <Button type="submit" loading={submitting} loadingText="접수 중…">
                                사건 접수
                            </Button>
                        </FormActions>
                    </form>
                </Card>
                <aside className={styles.aiPanel} aria-label="AI 도움 안내">
                    <span className={`${styles.aiChip} micro`}>AI 도움</span>
                    <h2 className="title3">어떤 상황인지 먼저 확인해 보세요</h2>
                    <p className={`${styles.ink2} body2`}>상황을 입력하면 AI가 유사한 범죄 사례와 대응 방법을 안내합니다.</p>
                    <div>
                        <ButtonLink variant="secondary" to="/cases/ai-search">
                            AI 유사 사건 찾기
                        </ButtonLink>
                    </div>
                    <p className={`${styles.warn} caption1`}>긴급한 위험이 있으면 접수 대신 바로 112에 전화하세요.</p>
                </aside>
            </div>
        </>
    );
}
