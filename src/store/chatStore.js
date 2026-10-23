import { create } from 'zustand';

// 시민 화면 어디서나 여는 AI 분실물 챗봇 패널의 열림 상태(레이아웃·마이페이지가 공유).
export const useChatStore = create((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    toggle: () => set((state) => ({ open: !state.open })),
}));
