import { todayDate } from './format';

// 챗봇 설명에서 물품 종류·장소·날짜를 뽑는 단순 규칙. 결과는 사용자에게 "인식 결과"로 보여 주고 확인받는다.
const CATEGORY_WORDS = {
    ELECTRONICS: ['휴대폰', '핸드폰', '스마트폰', '폴더폰', '폰', '이어폰', '노트북', '태블릿', '충전기', '카메라', '전자기기'],
    WALLET_CARD: ['지갑', '카드', '명함', '교통카드', '신분증'],
    ACCESSORY: ['배지', '뱃지', '반지', '목걸이', '귀걸이', '머리핀', '팔찌', '브로치', '안경', '액세서리'],
    WATCH: ['시계', '손목시계'],
    CLOTHING_GOODS: ['우산', '가방', '모자', '넥타이', '옷', '재킷', '목도리', '신발', '장갑', '손수건', '축구공'],
    ETC: ['노트', '열쇠', '쪽지', '책'],
};

export function detectCategory(text) {
    for (const [code, words] of Object.entries(CATEGORY_WORDS)) {
        const word = words.find((candidate) => text.includes(candidate));
        if (word) {
            return { category: code, word };
        }
    }
    return null;
}

function offsetDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function detectDate(text) {
    if (/그저께|그제/.test(text)) {
        return offsetDate(2);
    }
    if (/어제/.test(text)) {
        return offsetDate(1);
    }
    if (/오늘|아까|방금/.test(text)) {
        return todayDate();
    }
    const daysAgo = text.match(/(\d+)\s*일\s*전/);
    if (daysAgo) {
        return offsetDate(Number(daysAgo[1]));
    }
    const monthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (monthDay) {
        return `${new Date().getFullYear()}-${monthDay[1].padStart(2, '0')}-${monthDay[2].padStart(2, '0')}`;
    }
    return null;
}

// 장소 앞에 붙은 시간 표현(어제, 3일 전 등)은 장소에서 뺀다.
const TIME_WORDS = /^(?:오늘|어제|그저께|그제|아까|방금|\d+\s*일\s*전|\d{1,2}\s*월\s*\d{1,2}\s*일)\s*/;

export function detectPlace(text) {
    const match = text.match(/([가-힣A-Za-z0-9]+(?:\s?[가-힣A-Za-z0-9]+)?)\s*(?:에서|근처|앞에서|쪽에서|부근)/);
    if (!match) {
        return null;
    }
    const place = match[1].replace(TIME_WORDS, '').trim();
    return place || null;
}
