import { useCallback, useState } from 'react';
import { assignOfficer } from '../../api/cases';
import { getAssignablePolice } from '../../api/users';
import { useSubmit } from '../../hooks/useSubmit';
import { useAsync } from '../../hooks/useAsync';
import Modal from '../common/Modal';
import { Button } from '../common/Button';
import { EmptyState, ErrorState, LoadingState } from '../common/Feedback';
import { Stack } from '../common/Layout';
import styles from './CaseModals.module.css';

// 담당 경찰 배정(ADM-003)·변경(ADM-004). 배정 가능한 경찰 목록에서 한 명을 선택한다.
// 배정 요청은 사건 API(A)를 사용하고, 호출한 화면이 onAssigned로 갱신을 담당한다.
export default function AssignOfficerModal({ open, caseId, caseTitle, currentOfficerId, onClose, onAssigned }) {
    const [officerId, setOfficerId] = useState('');
    const [fieldError, setFieldError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const isChange = Boolean(currentOfficerId);
    const loader = useCallback(
        () => (open ? getAssignablePolice() : Promise.resolve({ officers: [] })),
        [open]
    );

    const {
        data: policeData,
        error: policeError,
        loading: policeLoading,
        reload: reloadPolice,
    } = useAsync(loader);

    const officers = policeData?.officers ?? [];

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
            setFieldError(isChange ? '변경할 경찰을 선택하세요.' : '배정할 경찰을 선택하세요.');
            return;
        }
        if (parsed === currentOfficerId) {
            setFieldError('현재 등록된 경찰과 동일한 경찰로는 변경할 수 없습니다.');
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
                    <Button type="submit" form="assign-officer-form"
                        disabled={!officerId || policeLoading || Boolean(policeError)}
                        loading={submitting} loadingText="처리 중…">
                        {isChange ? '변경' : '배정'}
                    </Button>
                </>
            }
        >
            <Stack as="form" id="assign-officer-form" gap={12} onSubmit={handleSubmit} noValidate>
                {isChange ? (
                    <div className={`${styles.note} body2`}>
                        현재 담당 경찰은 다시 선택할 수 없습니다.
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

                <ErrorState error={policeError} onRetry={reloadPolice} />
                <ErrorState error={error} />

                {policeLoading ? (
                    <LoadingState text="배정 가능한 경찰을 불러오는 중입니다…" />
                ) : officers.length === 0 ? (
                    <EmptyState title="배정 가능한 경찰이 없습니다." />
                ) : (
                    <fieldset className={styles.officerFieldset}>
                        <legend className="visually-hidden">
                            {isChange ? '변경할 경찰 선택' : '담당 경찰 선택'}
                        </legend>

                        <div className={styles.officerList}>
                            {officers.map((officer) => {
                                const isCurrent = officer.userId === currentOfficerId;

                                return (
                                    <label
                                        key={officer.userId}
                                        className={`${styles.officerChoice} ${isCurrent ? styles.officerCurrent : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="officerId"
                                            value={officer.userId}
                                            checked={Number(officerId) === officer.userId}
                                            disabled={isCurrent}
                                            onChange={(event) => {
                                                setOfficerId(event.target.value);
                                                setFieldError('');
                                            }}
                                        />

                                        <span className={styles.officerName}>
                                            <b className="label">{officer.name}</b>
                                            {isCurrent && <span className="caption1">현재 담당</span>}
                                        </span>

                                        <span className={`${styles.caseCount} body2`}>
                                            진행 {officer.investigatingCaseCount}건
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {fieldError && (
                            <p className={`${styles.fieldError} caption1`} role="alert">
                                {fieldError}
                            </p>
                        )}
                    </fieldset>
                )}
            </Stack>
        </Modal>
    );
}
