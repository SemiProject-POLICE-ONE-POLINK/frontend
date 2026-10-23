import { Route } from 'react-router';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';

// 담당: A — 로그인·회원가입 (비로그인 전용)
export const authRoutes = (
    <>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
    </>
);
