import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드 SecurityConfig의 CORS 허용 origin이 http://localhost:5173이므로 포트를 고정한다.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
    },
});
