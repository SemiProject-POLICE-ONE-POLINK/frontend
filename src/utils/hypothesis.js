// 수사 자료 조회 결과로 번호→자료 조회표를 만든다. 가설 근거의 번호를 이름으로 보여 줄 때 쓴다.
export function buildBasisLookup(evidences = [], witnesses = []) {
    const evidenceMap = new Map(evidences.map((item) => [item.evidenceId, item]));
    const statementMap = new Map();
    witnesses.forEach((witness) => {
        (witness.statements ?? []).forEach((statement) => {
            statementMap.set(statement.statementId, { ...statement, witnessName: witness.name, witnessId: witness.witnessId });
        });
    });
    return { evidenceMap, statementMap };
}

// 추가 확인 사항은 줄 단위 목록("- 항목")으로 내려온다.
export function toCheckItems(text) {
    return String(text ?? '')
        .split(/\n+/)
        .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
        .filter(Boolean);
}
