import { useState } from 'react';
import { assignOfficer } from '../../api/cases';
import { useSubmit } from '../../hooks/useSubmit';
import Modal from '../common/Modal';
import { Button } from '../common/Button';
import { Field, Input } from '../common/Form';
import { ErrorState } from '../common/Feedback';
import { Stack } from '../common/Layout';
import styles from './CaseModals.module.css';

// 담당 경찰 배정(ADM-003)·변경(ADM-004). 경찰 회원 목록 API가 없어 회원 번호를 직접 입력받는다.
// 배정 요청은 사건 API(A)를 사용하고, 호출한 화면이 onAssigned로 갱신을 담당한다.
export default function AssignOfficerModal({ open, caseId, caseTitle, currentOfficerId, onClose, onAssigned }) {
    const [officerId, setOfficerId] = useState('');
    const [fieldError, setFieldError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const isChange = Boolean(currentOfficerId);

    const close = () => {
        setOfficerId('');
        setFieldError('');
        clearError();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const parsed = Number(officerId);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            setFieldError(isChange ? '변경할 경찰을 입력하세요.' : '배정할 경찰을 입력하세요.');
            return;
        }
        if (parsed === currentOfficerId) {
            setFieldError('현재 등록된 경찰과 동일한 경찰관으로는 변경할 수 없습니다.');
            return;
        }
        setFieldError('');
        const result = await submit(() => assignOfficer(caseId, parsed));
        if (result) {
            setOfficerId('');
            onAssigned(result);
        }
    };

    return (
        <Modal
            open={open}
            title={isChange ? '담당 경찰 변경' : '담당 경찰 배정'}
            onClose={close}
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        취소
                    </Button>
                    <Button type="submit" form="assign-officer-form" disabled={!officerId} loading={submitting} loadingText="처리 중…">
                        {isChange ? '변경' : '배정'}
                    </Button>
                </>
            }
        >
            <Stack as="form" id="assign-officer-form" gap={12} onSubmit={handleSubmit} noValidate>
                {isChange ? (
                    <div className={`${styles.note} body2`}>
                        현재 담당 경찰 회원 번호 <b className="num">{currentOfficerId}</b>
                        <br />
                        변경하면 사건 접근 권한도 새 담당 경찰로 바뀝니다.
                    </div>
                ) : (
                    <>
                        <div className={`${styles.note} body2`}>
                            <span className="num">{caseId}</span>
                            {caseTitle && ` · ${caseTitle}`}
                            <br />
                            사건마다 담당 경찰은 1명만 배정할 수 있습니다. 배정 후에는 ‘담당 변경’으로만 바꿀 수 있습니다.
                        </div>
                        <div className={`${styles.note} body2`}>
                            배정하면 사건 상태와 수사 상태가 자동으로 <b>수사 중</b>으로 바뀝니다.
                        </div>
                    </>
                )}
                <ErrorState error={error} />
                <Field
                    label={isChange ? '변경할 경찰 회원 번호' : '담당 경찰 회원 번호'}
                    required
                    error={fieldError}
                    hint="경찰 목록 API가 준비되기 전까지 경찰 역할 회원의 번호를 직접 입력합니다."
                >
                    {(props) => (
                        <Input {...props} type="number" min="1" inputMode="numeric" value={officerId} onChange={(event) => setOfficerId(event.target.value)} />
                    )}
                </Field>
            </Stack>
        </Modal>
    );
}
