// 서버는 타임존 없는 ISO 문자열(LocalDate·LocalDateTime)을 주고받는다.

const pad = (value) => String(value).padStart(2, '0');

export function formatDate(value) {
    if (!value) {
        return '-';
    }
    return String(value).slice(0, 10).replaceAll('-', '.');
}

export function formatDateTime(value) {
    if (!value) {
        return '-';
    }
    const [date, time = ''] = String(value).split('T');
    return `${date.replaceAll('-', '.')} ${time.slice(0, 5)}`.trim();
}

export function todayDate() {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function nowDateTimeInput() {
    const now = new Date();
    return `${todayDate()}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// datetime-local 입력값(yyyy-MM-ddTHH:mm)을 ISO_LOCAL_DATE_TIME으로 맞춘다.
export function toLocalDateTime(inputValue) {
    if (!inputValue) {
        return inputValue;
    }
    return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

export function formatNumber(value) {
    if (value === null || value === undefined) {
        return '-';
    }
    return Number(value).toLocaleString('ko-KR');
}

export function labelOf(labelMap, code) {
    if (!code) {
        return '-';
    }
    return labelMap[code] ?? code;
}
