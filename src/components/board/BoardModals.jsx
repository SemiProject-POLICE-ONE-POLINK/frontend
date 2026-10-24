import { useState } from 'react';
import { closeInvestigation, createEvidence, createInvestigationLog, createStatement, createWitness } from '../../api/investigations';
import { useSubmit } from '../../hooks/useSubmit';
import { EVIDENCE_TYPE_LABEL, FOLLOW_UP_STATEMENT_TYPES, STATEMENT_TYPE_LABEL } from '../../constants/codes';
import { nowDateTimeInput, toLocalDateTime } from '../../utils/format';
import Modal from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorState } from '../common/Feedback';
import { Field, FormGrid, Input, Select, Textarea } from '../common/Form';
import styles from './BoardParts.module.css';

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function ModalFooter({ formId, onClose, submitting, disabled, label, loadingText = '저장 중…' }) {
    return (
        <>
            <Button variant="secondary" onClick={onClose}>
                취소
            </Button>
            <Button type="submit" form={formId} disabled={disabled} loading={submitting} loadingText={loadingText}>
                {label}
            </Button>
        </>
    );
}

// 수사기록 등록(POL-004)
export function LogFormModal({ open, caseId, officerName, onClose, onSaved }) {
    const [form, setForm] = useState(() => ({ content: '', investigatedAt: nowDateTimeInput() }));
    const [fieldError, setFieldError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = form.content.trim() && form.investigatedAt;

    const close = () => {
        clearError();
        setFieldError('');
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (form.investigatedAt > nowDateTimeInput()) {
            setFieldError('수사 일시는 미래로 설정할 수 없습니다.');
            return;
        }
        setFieldError('');
        const result = await submit(() =>
            createInvestigationLog(caseId, { content: form.content.trim(), investigatedAt: toLocalDateTime(form.investigatedAt) })
        );
        if (result) {
            setForm({ content: '', investigatedAt: nowDateTimeInput() });
            onSaved(result);
        }
    };

    return (
        <Modal
            open={open}
            title="수사기록 등록"
            onClose={close}
            footer={<ModalFooter formId="log-form" onClose={close} submitting={submitting} disabled={!filled} label="저장" />}
        >
            <form id="log-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <Field label="수사 내용" required hint="조사 내용과 수사 활동을 한 칸에 작성합니다.">
                    {(props) => (
                        <Textarea
                            {...props}
                            rows={6}
                            placeholder="예: 교차로 CCTV 3개소 영상 임의제출. 흰색 경차 이동 경로 확인"
                            value={form.content}
                            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                        />
                    )}
                </Field>
                <Field label="수사 일시" required error={fieldError}>
                    {(props) => (
                        <Input
                            {...props}
                            type="datetime-local"
                            max={nowDateTimeInput()}
                            value={form.investigatedAt}
                            onChange={(event) => setForm((prev) => ({ ...prev, investigatedAt: event.target.value }))}
                        />
                    )}
                </Field>
                <p className={`${styles.note} caption1`}>기록 일시와 작성자({officerName})는 자동으로 저장됩니다.</p>
            </form>
        </Modal>
    );
}

const EMPTY_EVIDENCE = { evidenceName: '', evidenceType: '', acquiredLocation: '', description: '' };

// 증거물 등록(POL-005). 서버는 파일 1개만 받고 확보 일시는 등록 시각으로 저장한다.
export function EvidenceFormModal({ open, caseId, officerName, onClose, onSaved }) {
    const [form, setForm] = useState(EMPTY_EVIDENCE);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = Object.values(form).every((value) => value.trim());

    const close = () => {
        clearError();
        setFileError('');
        onClose();
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFile = (event) => {
        const selected = event.target.files?.[0] ?? null;
        event.target.value = '';
        if (selected && selected.size > MAX_FILE_BYTES) {
            setFileError(`${selected.name}: 20MB를 넘는 파일은 첨부할 수 없습니다.`);
            return;
        }
        setFileError('');
        setFile(selected);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (form.evidenceName.length > 50) {
            return;
        }
        const body = {
            evidenceName: form.evidenceName.trim(),
            evidenceType: form.evidenceType,
            description: form.description.trim(),
            acquiredLocation: form.acquiredLocation.trim(),
        };
        const result = await submit(() => createEvidence(caseId, body, file));
        if (result) {
            setForm(EMPTY_EVIDENCE);
            setFile(null);
            onSaved(result);
        }
    };

    return (
        <Modal
            open={open}
            title="증거물 등록"
            onClose={close}
            footer={<ModalFooter formId="evidence-form" onClose={close} submitting={submitting} disabled={!filled} label="등록" loadingText="등록 중…" />}
        >
            <form id="evidence-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <FormGrid>
                    <Field label="증거물명" required hint="50자 이내" className="span-all">
                        {(props) => <Input {...props} name="evidenceName" maxLength={50} value={form.evidenceName} onChange={handleChange} />}
                    </Field>
                    <Field label="증거물 유형" required>
                        {(props) => (
                            <Select {...props} name="evidenceType" value={form.evidenceType} onChange={handleChange}>
                                <option value="">선택</option>
                                {Object.entries(EVIDENCE_TYPE_LABEL).map(([code, label]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Field label="확보 장소" required>
                        {(props) => <Input {...props} name="acquiredLocation" maxLength={255} value={form.acquiredLocation} onChange={handleChange} />}
                    </Field>
                    <Field label="메모" required className="span-all">
                        {(props) => (
                            <Input {...props} name="description" placeholder="증거물의 특징, 발견 경위 등" value={form.description} onChange={handleChange} />
                        )}
                    </Field>
                    <Field label="첨부 파일 (선택 · 1개)" error={fileError} hint="파일당 20MB 이하. 등록 후에는 수정·삭제할 수 없어 원본 그대로 보관됩니다." className="span-all">
                        {(props) => <Input {...props} type="file" accept="image/*,video/*,.pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFile} />}
                    </Field>
                </FormGrid>
                {file && (
                    <div className={styles.fileRow}>
                        <span className="body2">{file.name}</span>
                        <span className="num caption1">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                        <button type="button" className={styles.fileRemove} onClick={() => setFile(null)} aria-label={`${file.name} 삭제`}>
                            ×
                        </button>
                    </div>
                )}
                <p className={`${styles.note} caption1`}>증거번호, 확보 일시(등록 시각)와 취득자(담당 경찰 {officerName})는 자동으로 저장됩니다.</p>
            </form>
        </Modal>
    );
}

const EMPTY_WITNESS = { name: '', phone: '', relationship: '', content: '' };

// 목격자와 최초 진술 등록(POL-006)
export function WitnessFormModal({ open, caseId, onClose, onSaved }) {
    const [form, setForm] = useState(EMPTY_WITNESS);
    const [phoneError, setPhoneError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = Object.values(form).every((value) => value.trim());

    const close = () => {
        clearError();
        setPhoneError('');
        onClose();
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!PHONE_PATTERN.test(form.phone)) {
            setPhoneError('연락처는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }
        setPhoneError('');
        const result = await submit(() =>
            createWitness(caseId, {
                name: form.name.trim(),
                phone: form.phone,
                relationship: form.relationship.trim(),
                content: form.content.trim(),
            })
        );
        if (result) {
            setForm(EMPTY_WITNESS);
            onSaved(result);
        }
    };

    return (
        <Modal
            open={open}
            title="목격자 및 최초 진술 등록"
            onClose={close}
            footer={<ModalFooter formId="witness-form" onClose={close} submitting={submitting} disabled={!filled} label="등록" loadingText="등록 중…" />}
        >
            <form id="witness-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <FormGrid>
                    <Field label="목격자명" required>
                        {(props) => <Input {...props} name="name" maxLength={50} value={form.name} onChange={handleChange} />}
                    </Field>
                    <Field label="연락처" required error={phoneError}>
                        {(props) => <Input {...props} type="tel" name="phone" placeholder="010-0000-0000" value={form.phone} onChange={handleChange} />}
                    </Field>
                    <Field label="사건과의 관계" required className="span-all">
                        {(props) => (
                            <Input {...props} name="relationship" maxLength={50} placeholder="예: 인근 상점 주인" value={form.relationship} onChange={handleChange} />
                        )}
                    </Field>
                    <Field label="최초 진술" required className="span-all">
                        {(props) => <Textarea {...props} name="content" rows={4} value={form.content} onChange={handleChange} />}
                    </Field>
                </FormGrid>
            </form>
        </Modal>
    );
}

// 진술 추가(POL-006 진술 추가)
export function StatementFormModal({ caseId, witness, onClose, onSaved }) {
    const [statementType, setStatementType] = useState(FOLLOW_UP_STATEMENT_TYPES[0]);
    const [content, setContent] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();

    const close = () => {
        clearError();
        setContent('');
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const result = await submit(() => createStatement(caseId, witness.witnessId, { statementType, content: content.trim() }));
        if (result) {
            setContent('');
            onSaved(result);
        }
    };

    return (
        <Modal
            open={Boolean(witness)}
            title={witness ? `${witness.name} — 진술 추가` : '진술 추가'}
            onClose={close}
            footer={<ModalFooter formId="statement-form" onClose={close} submitting={submitting} disabled={!content.trim()} label="저장" />}
        >
            <form id="statement-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <p className={`${styles.note} caption1`}>기존 진술은 수정·삭제하지 않고 이력으로 보존됩니다.</p>
                <ErrorState error={error} />
                <Field label="진술 구분" required>
                    {(props) => (
                        <Select {...props} value={statementType} onChange={(event) => setStatementType(event.target.value)}>
                            {FOLLOW_UP_STATEMENT_TYPES.map((code) => (
                                <option key={code} value={code}>
                                    {STATEMENT_TYPE_LABEL[code]}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <Field label="진술 내용" required>
                    {(props) => <Textarea {...props} rows={5} value={content} onChange={(event) => setContent(event.target.value)} />}
                </Field>
            </form>
        </Modal>
    );
}

const EMPTY_CLOSE_FORM = { result: '', reason: '' };

// 수사 종결(POL-003). 입력 → 확인 두 단계로 진행한다. 채택 가설이 없어도 종결할 수 있다.
// 확인 단계에서 취소하면 입력 단계로 돌아가지 않고 팝업 전체를 닫는다.
export function InvestigationCloseModal({ open, caseId, onClose, onClosed }) {
    const [form, setForm] = useState(EMPTY_CLOSE_FORM);
    const [confirming, setConfirming] = useState(false);
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = form.result.trim() && form.reason.trim();

    const close = () => {
        clearError();
        setForm(EMPTY_CLOSE_FORM);
        setConfirming(false);
        onClose();
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (filled) {
            setConfirming(true);
        }
    };

    const confirmClose = async () => {
        const result = await submit(() => closeInvestigation(caseId, { result: form.result.trim(), reason: form.reason.trim() }));
        if (result) {
            setForm(EMPTY_CLOSE_FORM);
            setConfirming(false);
            onClosed(result);
        }
    };

    if (confirming) {
        return (
            <Modal
                open={open}
                title="수사를 종결하시겠습니까?"
                onClose={close}
                footer={
                    <>
                        <Button variant="secondary" onClick={close} disabled={submitting}>
                            취소
                        </Button>
                        <Button onClick={confirmClose} loading={submitting} loadingText="종결 처리 중…">
                            종결하기
                        </Button>
                    </>
                }
            >
                <ErrorState error={error} />
                <p className="body2">
                    수사를 종결하면 사건 상태가 즉시 ‘종결 대기’로 변경됩니다.
                    <br />
                    종결된 수사는 복구할 수 없으며, 해당 사건의 수사보드는 조회만 가능합니다.
                </p>
            </Modal>
        );
    }

    return (
        <Modal
            open={open}
            title="수사 종결"
            onClose={close}
            footer={<ModalFooter formId="investigation-close-form" onClose={close} disabled={!filled} label="수사 종결" />}
        >
            <form id="investigation-close-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <Field label="수사 처리 결과" required>
                    {(props) => (
                        <Input
                            {...props}
                            placeholder="예: 피의자 2명 검거"
                            value={form.result}
                            onChange={(event) => setForm((prev) => ({ ...prev, result: event.target.value }))}
                        />
                    )}
                </Field>
                <Field label="종결 사유" required>
                    {(props) => (
                        <Textarea {...props} rows={4} value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} />
                    )}
                </Field>
            </form>
        </Modal>
    );
}
