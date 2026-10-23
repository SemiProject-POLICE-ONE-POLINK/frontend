import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { homePathOf } from '../../config/nav';
import { USER_ROLE_LABEL } from '../../constants/codes';
import { useSubmit } from '../../hooks/useSubmit';
import { readDemoAccounts } from '../../utils/demoAccounts';
import { Button } from '../../components/common/Button';
import { Field, Input } from '../../components/common/Form';
import { Alert } from '../../components/common/Feedback';
import styles from './AuthPage.module.css';

const DEMO_ACCOUNTS = readDemoAccounts();
const DEMO_ROLES = ['CITIZEN', 'POLICE', 'ADMIN'].filter((role) => DEMO_ACCOUNTS.some((account) => account.role === role));

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const saveLogin = useAuthStore((state) => state.login);
    const { submit, submitting, error } = useSubmit();
    const [form, setForm] = useState({ userName: location.state?.userName ?? '', password: '' });
    const [demoRole, setDemoRole] = useState(DEMO_ROLES[0]);
    const canSubmit = form.userName.trim() && form.password;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const signIn = async (credentials) => {
        const result = await submit(() => login(credentials));
        if (result) {
            saveLogin(result);
            // 로그인 후 권한별 첫 화면: 시민은 마이페이지, 경찰·관리자는 대시보드(COM-001 ③).
            navigate(location.state?.from ?? homePathOf(result.role), { replace: true });
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (canSubmit) {
            signIn({ userName: form.userName.trim(), password: form.password });
        }
    };

    return (
        <>
            {error && <Alert tone="error">{error.status === 401 ? '아이디 또는 비밀번호가 맞지 않습니다. 다시 확인해 주세요.' : error.message}</Alert>}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <Field label="아이디">
                    {(props) => (
                        <Input {...props} name="userName" autoComplete="username" placeholder="예: miran" value={form.userName} onChange={handleChange} />
                    )}
                </Field>
                <Field label="비밀번호">
                    {(props) => (
                        <Input {...props} type="password" name="password" autoComplete="current-password" value={form.password} onChange={handleChange} />
                    )}
                </Field>
                <Button type="submit" block disabled={!canSubmit} loading={submitting} loadingText="로그인 중…">
                    로그인
                </Button>
            </form>
            {DEMO_ACCOUNTS.length > 0 && (
                <section aria-label="데모 계정">
                    <p className={`${styles.eyebrow} eyebrow`}>데모 계정으로 바로 들어가기</p>
                    <div className={styles.demoTabs} role="group" aria-label="데모 계정 권한">
                        {DEMO_ROLES.map((role) => (
                            <button key={role} type="button" className="label" aria-pressed={demoRole === role} onClick={() => setDemoRole(role)}>
                                {USER_ROLE_LABEL[role]}
                            </button>
                        ))}
                    </div>
                    <div className={styles.demoGrid}>
                        {DEMO_ACCOUNTS.filter((account) => account.role === demoRole).map((account) => (
                            <button
                                key={account.userName}
                                type="button"
                                className={styles.demo}
                                disabled={submitting}
                                onClick={() => signIn({ userName: account.userName, password: account.password })}
                            >
                                <span className="label">{account.name}</span>
                                <span className="caption1">{USER_ROLE_LABEL[account.role] ?? account.role}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}
