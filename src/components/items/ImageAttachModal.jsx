import { useEffect, useState } from 'react';
import { attachItemImage } from '../../api/items';
import { useSubmit } from '../../hooks/useSubmit';
import { validateImage } from '../../utils/itemForm';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import { Button } from '../common/Button';
import { ErrorState } from '../common/Feedback';
import { Field, Input } from '../common/Form';
import styles from './ItemModals.module.css';

// 본인 분실물에 이미지 1장을 첨부한다. 서버는 이미지가 이미 있으면 거부한다.
export default function ImageAttachModal({ open, itemId, onClose, onSaved }) {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState('');
    const [fieldError, setFieldError] = useState('');
    const { submit, submitting, error, clearError } = useSubmit();

    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

    const handleImage = (event) => {
        const file = event.target.files?.[0] ?? null;
        const message = validateImage(file);
        setFieldError(message);
        if (message || !file) {
            event.target.value = '';
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const close = () => {
        clearError();
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const result = await submit(() => attachItemImage(itemId, image));
        if (result) {
            onSaved(result);
        }
    };

    return (
        <Modal
            open={open}
            title="이미지 첨부"
            onClose={close}
            footer={
                <>
                    <Button variant="secondary" onClick={close}>
                        취소
                    </Button>
                    <Button type="submit" form="image-form" disabled={!image} loading={submitting} loadingText="업로드 중…">
                        첨부
                    </Button>
                </>
            }
        >
            <form id="image-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <ErrorState error={error} />
                <Field label="이미지 파일 (1개)" error={fieldError} hint="PNG·JPG·WEBP, 2MB 이하">
                    {(props) => (
                        <div className={styles.imgPick}>
                            <span className={styles.imgThumb}>{preview ? <img src={preview} alt="첨부 이미지 미리보기" /> : <Icon name="PHOTO" size={22} />}</span>
                            <Input {...props} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />
                        </div>
                    )}
                </Field>
            </form>
        </Modal>
    );
}
