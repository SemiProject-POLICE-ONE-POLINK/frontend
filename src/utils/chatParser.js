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

// 날짜 표현은 장소를 찾기 전에 문장 전체에서 제거한다. 예를 들어
// "10월 25일 엘리베이터에서"는 "엘리베이터"만 장소로 인식해야 한다.
const TIME_WORDS = /오늘|어제|그저께|그제|아까|방금|\d+\s*일\s*전|\d{1,2}\s*월\s*\d{1,2}\s*일/g;

export function detectPlace(text) {
    const withoutTime = text.replace(TIME_WORDS, ' ').replace(/\s+/g, ' ').trim();
    // 조사 "에"도 지원해 "엘리베이터에 10월 25일" 같은 자연어 입력을 처리한다.
    // 조사 바로 앞의 마지막 단어만 장소로 사용해, 물품명까지 장소에 섞이지 않게 한다.
    const match = withoutTime.match(/([가-힣A-Za-z0-9]+)\s*(?:에서|근처|앞에서|쪽에서|부근|에(?=\s|$))/);
    if (!match) {
        return null;
    }
    return match[1] || null;
}

// 물품명·장소·날짜·조사·서술어를 제외하고, 색상·재질·무늬처럼 비교에 쓸 특징 단어만 남긴다.
// 완전한 자연어 분석은 아니지만 "하얀색 가방을 10월 25일 엘리베이터에서" 같은 입력에서
// "하얀색"을 안정적으로 분리해 습득물 설명과 비교할 수 있다.
const FEATURE_FILLER_WORDS = new Set([
    '잃어버림', '잃어버렸', '잃어버렸어요', '분실', '찾아줘', '찾아주세요', '물건', '물품', '에서', '근처', '앞', '쪽', '부근', '에',
]);

export function detectFeatureTerms(text, { word, place } = {}) {
    const withoutKnownFields = text
        .replace(TIME_WORDS, ' ')
        .replace(place ?? '', ' ')
        .replace(word ?? '', ' ');

    return [...new Set(
        (withoutKnownFields.match(/[가-힣A-Za-z0-9]+/g) ?? [])
            .map((term) => term.replace(/(?:을|를|이|가|은|는|에|의|과|와|도|로|으로)$/u, ''))
            .filter((term) => term.length > 1 && !FEATURE_FILLER_WORDS.has(term))
    )].slice(0, 4);
}
