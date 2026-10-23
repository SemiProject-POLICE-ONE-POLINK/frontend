// 서버 enum 원문과 화면 라벨의 단일 기준. 요청·조건 분기에는 원문 키만 사용한다.

export const USER_ROLE = {
    CITIZEN: 'CITIZEN',
    POLICE: 'POLICE',
    ADMIN: 'ADMIN',
};

export const USER_ROLE_LABEL = {
    CITIZEN: '시민',
    POLICE: '경찰',
    ADMIN: '관리자',
};

export const CASE_TYPE_LABEL = {
    THEFT: '절도',
    FRAUD: '사기',
    MISSING: '실종',
    CYBER: '사이버범죄',
    ETC: '기타',
};

// INVESTIGATION_DONE: 담당 경찰이 수사를 종결해 관리자의 사건 종결을 기다리는 상태.
export const CASE_STATUS = {
    WAITING: 'WAITING',
    INVESTIGATING: 'INVESTIGATING',
    INVESTIGATION_DONE: 'INVESTIGATION_DONE',
    CLOSED: 'CLOSED',
    CANCELED: 'CANCELED',
};

export const CASE_STATUS_LABEL = {
    WAITING: '대기 중',
    INVESTIGATING: '수사 중',
    INVESTIGATION_DONE: '종결 대기',
    CLOSED: '종결',
    CANCELED: '취소',
};

export const EVIDENCE_TYPE_LABEL = {
    PHOTO: '사진',
    VIDEO: '영상',
    DOCUMENT: '문서',
    SEIZED: '압수물',
    ETC: '기타',
};

export const STATEMENT_TYPE_LABEL = {
    INITIAL: '최초',
    ADDITIONAL: '추가',
    CORRECTION: '정정',
    REVERSAL: '번복',
};

// 추가 진술 등록 시 최초 진술은 서버가 목격자 등록 때만 만든다.
export const FOLLOW_UP_STATEMENT_TYPES = ['ADDITIONAL', 'CORRECTION', 'REVERSAL'];

export const ITEM_TYPE = {
    LOST: 'LOST',
    FOUND: 'FOUND',
};

export const ITEM_TYPE_LABEL = {
    LOST: '분실물',
    FOUND: '습득물',
};

// 물품 종류는 DB에 영문 코드로 저장된다(더미 SQL 기준).
export const ITEM_CATEGORY_LABEL = {
    ELECTRONICS: '전자기기',
    WALLET_CARD: '지갑·카드',
    ACCESSORY: '액세서리',
    WATCH: '시계',
    CLOTHING_GOODS: '의류·잡화',
    ETC: '기타',
};

export const ITEM_STATUS = {
    LOST: 'LOST',
    STORED: 'STORED',
    HANDOVER_PENDING: 'HANDOVER_PENDING',
    RETURNED: 'RETURNED',
};

export const ITEM_STATUS_LABEL = {
    LOST: '분실 중',
    STORED: '보관 중',
    HANDOVER_PENDING: '인계 대기',
    RETURNED: '반환 완료',
};

export const RETURN_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
};

export const RETURN_STATUS_LABEL = {
    PENDING: '신청',
    APPROVED: '승인',
    REJECTED: '반려',
    COMPLETED: '인계 완료',
};

// 상태 배지 톤 — 디자인 토큰 status-{tone}-fg/bg에 대응한다.
export const STATUS_TONE = {
    WAITING: 'wait',
    INVESTIGATION_DONE: 'wait',
    LOST: 'wait',
    PENDING: 'wait',
    INVESTIGATING: 'run',
    STORED: 'run',
    HANDOVER_PENDING: 'run',
    APPROVED: 'run',
    CLOSED: 'done',
    RETURNED: 'done',
    COMPLETED: 'done',
    CANCELED: 'cancel',
    REJECTED: 'crit',
};

export const DEFAULT_PAGE_SIZE = 10;
