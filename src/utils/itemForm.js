import { todayDate } from './format';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateItemFields(form) {
    const errors = {};
    if (form.occurredAt && form.occurredAt > todayDate()) {
        errors.occurredAt = '발생 일자는 오늘 날짜보다 미래일 수 없습니다.';
    }
    return errors;
}

export function isItemFormFilled(form) {
    return ['itemName', 'category', 'occurredAt', 'location', 'description'].every((key) => String(form[key] ?? '').trim());
}

// 413을 기다리지 않도록 서버 제한(2MB)과 같은 기준으로 먼저 안내한다(CIT-007 ⑥).
export function validateImage(file) {
    if (!file) {
        return '';
    }
    if (!IMAGE_TYPES.includes(file.type)) {
        return 'PNG, JPG, WEBP 형식만 올릴 수 있습니다.';
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return '2MB 이하 이미지만 올릴 수 있습니다.';
    }
    return '';
}

export function trimItemFields(form) {
    return {
        itemName: form.itemName.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        occurredAt: form.occurredAt,
    };
}
