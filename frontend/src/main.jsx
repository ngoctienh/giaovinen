import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios'

// 1. Cấu hình URL gốc cho tất cả API
axios.defaults.baseURL = 'http://localhost:5000/api';

// 2. Tự động đính kèm Token vào Header của mọi request
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('teacherToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Xử lý Token hết hạn hoặc lỗi xác thực (401 Unauthorized)
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Xóa thông tin đăng nhập cũ
            localStorage.removeItem('teacherToken');
            localStorage.removeItem('teacherInfo');
            localStorage.removeItem('teacherData');
            // Chuyển hướng về trang đăng nhập
            window.location.href = '/teacher/login';
        }
        return Promise.reject(error);
    }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)