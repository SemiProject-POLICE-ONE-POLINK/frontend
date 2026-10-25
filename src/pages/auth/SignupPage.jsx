import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login, signup } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { homePathOf } from '../../config/nav';
import { useSubmit } from '../../hooks/useSubmit';
import { Button } from '../../components/common/Button';
import { Field, FormGrid, Input } from '../../components/common/Form';
import { Alert } from '../../components/common/Feedback';
import styles from './AuthPage.module.css';

const MAX_LENGTH = 25;
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PHONE_RULE = /^010-\d{4}-\d{4}$/;

function validate(form) {
    const errors = {};
    if (form.name.length > MAX_LENGTH) {
        errors.name = '이름은 25자 이하여야 합니다.';
    }
    if (form.userName.length > MAX_LENGTH) {
        errors.userName = '아이디는 25자 이하여야 합니다.';
    }
    if (!PASSWORD_RULE.test(form.password)) {
        errors.password = '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 모두 포함해야 합니다.';
    }
    if (!PHONE_RULE.test(form.phone.trim())) {
        errors.phone = '연락처는 010-0000-0000 형식으로 입력해주세요.';
    }
    return errors;
}

export default function SignupPage() {
    const navigate = useNavigate();
    const saveLogin = useAuthStore((state) => state.login);
    const { submit, submitting, error } = useSubmit();
    const [form, setForm] = useState({ name: '', userName: '', password: '', phone: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const filled = Object.values(form).every((value) => value.trim());

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 검증 통과 시 계정을 만들고 같은 정보로 바로 로그인한다(COM-002 ⑥).
    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = validate(form);
        setFieldErrors(errors);
        if (!filled || Object.keys(errors).length > 0) {
            return;
        }
        const credentials = { userName: form.userName.trim(), password: form.password };
        const result = await submit(async () => {
            await signup({ ...credentials, name: form.name.trim(), phone: form.phone.trim() });
            return login(credentials);
        });
        if (result) {
            saveLogin(result);
            navigate(homePathOf(result.role), { replace: true });
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && <Alert tone="error">{error.message}</Alert>}
            <FormGrid>
                <Field label="이름" required error={fieldErrors.name}>
                    {(props) => <Input {...props} name="name" maxLength={MAX_LENGTH} autoComplete="name" value={form.name} onChange={handleChange} />}
                </Field>
                <Field label="아이디" required error={fieldErrors.userName}>
                    {(props) => (
                        <Input {...props} name="userName" maxLength={MAX_LENGTH} autoComplete="username" value={form.userName} onChange={handleChange} />
                    )}
                </Field>
                <Field label="비밀번호" required hint="8자 이상, 영문·숫자·특수문자 포함" error={fieldErrors.password}>
                    {(props) => (
                        <Input {...props} type="password" name="password" autoComplete="new-password" value={form.password} onChange={handleChange} />
                    )}
                </Field>
                <Field label="연락처" required error={fieldErrors.phone}>
                    {(props) => (
                        <Input
                            {...props}
                            type="tel"
                            name="phone"
                            maxLength={MAX_LENGTH}
                            placeholder="010-0000-0000"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={handleChange}
                        />
                    )}
                </Field>
            </FormGrid>
            <p className={`${styles.note} caption1`}>
                가입하면 <b>시민</b> 권한이 부여됩니다. 경찰·관리자 권한은 DB에서 사전 지정됩니다.
            </p>
            <Button type="submit" block disabled={!filled} loading={submitting} loadingText="가입 처리 중…">
                가입하기
            </Button>
        </form>
    );
}
