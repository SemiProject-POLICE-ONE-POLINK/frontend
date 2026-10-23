import { useState } from 'react';
import { createReturnRequest } from '../../api/returnRequests';
import { useSubmit } from '../../hooks/useSubmit';
import { formatDate } from '../../utils/format';
import Modal from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorState } from '../common/Feedback';
import { Field, Textarea } from '../common/Form';
import styles from './ItemModals.module.css';

// 습득물 반환 신청(CIT-006P). 본인이 등록한 "분실 중" 분실물 하나를 고른다.
// 서버가 신청 사유를 필수로 받으므로 정의서 항목에 신청 사유 입력을 더했다.
export default function ReturnRequestModal({ open, foundItem, lostItems, appliedLostIds, onClose, onSaved }) {
    const [lostItemId, setLostItemId] = useState('');
    const [reason, setReason] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();
    const filled = lostItemId && reason.trim();

    const close = () => {
        clearError();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const result = await submit(() => createReturnRequest({ lostItemId, foundItemId: foundItem.itemId, requestReason: reason.trim() }));
        if (result) {
            setLostItemId('');
            setReason('');
            onSaved(result);
        }
    };

    return (
        <Modal
            open={open}
            title="반환 신청"
            onClose={close}
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        취소
                    </Button>
                    <Button type="submit" form="return-request-form" disabled={!filled} loading={submitting} loadingText="신청 중…">
                        신청
                    </Button>
                </>
            }
        >
            <form id="return-request-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <p className={`${styles.note} body2`}>
                    습득물{' '}
                    <b>
                        <span className="num">{foundItem.itemId}</span> {foundItem.itemName}
                    </b>
                    과 일치하는 본인 분실물을 선택하세요. 경찰이 두 정보를 비교해 승인합니다.
                </p>
                <ErrorState error={error} />
                <fieldset className={styles.fieldset}>
                    <legend className="visually-hidden">본인 분실물 선택</legend>
                    {lostItems.map((item) => {
                        const applied = appliedLostIds.has(item.itemId);
                        return (
                            <label key={item.itemId} className={styles.choice}>
                                <input
                                    type="radio"
                                    name="lostItemId"
                                    value={item.itemId}
                                    checked={lostItemId === item.itemId}
                                    disabled={applied}
                                    onChange={() => setLostItemId(item.itemId)}
                                />
                                <span className={styles.choiceBody}>
                                    <span className="label">
                                        {item.itemName} <span className={`${styles.code} num caption2`}>{item.itemId}</span>
                                    </span>
                                    <span className={`${styles.muted} caption1`}>
                                        {item.location} · <span className="num">{formatDate(item.occurredAt)}</span>
                                        {applied && ' · 이미 신청함'}
                                    </span>
                                </span>
                            </label>
                        );
                    })}
                </fieldset>
                <Field label="신청 사유" required hint="내 물품임을 확인할 수 있는 특징을 적어 주세요.">
                    {(props) => <Textarea {...props} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}
                </Field>
            </form>
        </Modal>
    );
}
