import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// refresh token API가 없으므로 탭 단위(sessionStorage)로만 로그인 상태를 유지한다.
const EMPTY_AUTH = {
    accessToken: null,
    user: null,
};

export const useAuthStore = create(
    persist(
        (set) => ({
            ...EMPTY_AUTH,
            login: ({ accessToken, userId, userName, name, role }) =>
                set({
                    accessToken,
                    user: { userId, userName, name, role },
                }),
            logout: () => set({ ...EMPTY_AUTH }),
        }),
        {
            name: 'polink-auth',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                user: state.user,
            }),
        }
    )
);

export const selectIsLoggedIn = (state) => Boolean(state.accessToken && state.user);
export const selectRole = (state) => state.user?.role ?? null;
