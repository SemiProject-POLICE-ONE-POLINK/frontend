import { useEffect, useState } from 'react';
import { registerItem, updateItem } from '../../api/items';
import { useSubmit } from '../../hooks/useSubmit';
import { ITEM_CATEGORY_LABEL, ITEM_TYPE } from '../../constants/codes';
import { todayDate } from '../../utils/format';
import { isItemFormFilled, trimItemFields, validateImage, validateItemFields } from '../../utils/itemForm';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { Button } from '../common/Button';
import { ErrorState } from '../common/Feedback';
import { Field, FormGrid, Input, Select, Textarea } from '../common/Form';
import styles from './ItemModals.module.css';

const EMPTY = { itemName: '', category: '', occurredAt: '', location: '', description: '' };

function toForm(item, initial) {
    if (item) {
        return {
            itemName: item.itemName ?? '',
            category: item.category ?? '',
            occurredAt: item.occurredAt ?? '',
            location: item.location ?? '',
            description: item.description ?? '',
        };
    }
    return { ...EMPTY, ...initial };
}

// 분실물·습득물 등록·수정 팝업(CIT-007). 습득물도 같은 양식이며 항목명만 바뀐다.
// 수정 시 이미지는 상세 화면의 이미지 첨부로 바꾼다.
export default function ItemFormModal({ open, itemType, item, initial, onClose, onSaved }) {
    const isEdit = Boolean(item);
    const lost = itemType === ITEM_TYPE.LOST;
    const [form, setForm] = useState(() => toForm(item, initial));
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [errors, setErrors] = useState({});
    const { submit, submitting, error, clearError } = useSubmit();

    // 로컬 미리보기 URL은 이미지가 바뀌거나 팝업이 사라질 때 해제한다.
    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImage = (event) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = '';
        const message = validateImage(file);
        setErrors((prev) => ({ ...prev, image: message }));
        if (message || !file) {
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImage(null);
        setPreview('');
    };

    const close = () => {
        clearError();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const fieldErrors = validateItemFields(form);
        setErrors(fieldErrors);
        if (!isItemFormFilled(form) || Object.keys(fieldErrors).length > 0) {
            return;
        }
        const values = trimItemFields(form);
        const result = await submit(() => (isEdit ? updateItem(item.itemId, values) : registerItem({ itemType, ...values }, image)));
        if (result) {
            onSaved(result);
        }
    };

    const titleText = `${lost ? '분실물' : '습득물'} ${isEdit ? '수정' : '등록'}`;
    const formId = 'item-form';

    return (
        <Modal
            open={open}
            title={titleText}
            onClose={close}
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        취소
                    </Button>
                    <Button type="submit" form={formId} disabled={!isItemFormFilled(form)} loading={submitting} loadingText="저장 중…">
                        {isEdit ? '수정 저장' : '등록'}
                    </Button>
                </>
            }
        >
            <form id={formId} className={styles.form} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <FormGrid>
                    <Field label={lost ? '분실 물품' : '습득 물품'} required>
                        {(props) => <Input {...props} name="itemName" value={form.itemName} onChange={handleChange} />}
                    </Field>
                    <Field label="종류" required>
                        {(props) => (
                            <Select {...props} name="category" value={form.category} onChange={handleChange}>
                                <option value="">선택</option>
                                {Object.entries(ITEM_CATEGORY_LABEL).map(([code, label]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Field label={lost ? '분실일자' : '습득일자'} required error={errors.occurredAt}>
                        {(props) => <Input {...props} type="date" name="occurredAt" max={todayDate()} value={form.occurredAt} onChange={handleChange} />}
                    </Field>
                    <Field label="장소" required>
                        {(props) => <Input {...props} name="location" value={form.location} onChange={handleChange} />}
                    </Field>
                    <Field label="특징" required className="span-all">
                        {(props) => <Textarea {...props} name="description" rows={3} value={form.description} onChange={handleChange} />}
                    </Field>
                    {!isEdit && (
                        <Field label="이미지 (선택)" error={errors.image} hint="PNG·JPG·WEBP 1개, 2MB 이하. 등록 후에도 상세 화면에서 첨부할 수 있습니다." className="span-all">
                            {(props) => (
                                <div className={styles.imgPick}>
                                    <span className={styles.imgThumb}>
                                        {preview ? <img src={preview} alt="첨부 이미지 미리보기" /> : <Icon name="PHOTO" size={22} />}
                                    </span>
                                    <div>
                                        <Input {...props} type="file" accept={'image/png,image/jpeg,image/webp'} onChange={handleImage} />
                                        {image && (
                                            <button type="button" className={`${styles.linkButton} caption2`} onClick={clearImage}>
                                                이미지 삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Field>
                    )}
                </FormGrid>
                <p className={`${styles.note} caption1`}>등록자와 등록 일시는 자동으로 기록됩니다.</p>
            </form>
        </Modal>
    );
}
