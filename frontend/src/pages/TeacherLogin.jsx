import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TeacherLogin.css';

const TeacherLogin = () => {
    const [credentials, setCredentials] = useState({ teacher_id: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
           const response = await axios.post('/auth/teacher/login', credentials);
            localStorage.setItem('teacherToken', response.data.token);
            localStorage.setItem('teacherInfo', JSON.stringify(response.data.teacher));
            navigate('/teacher/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi kết nối đến máy chủ.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="brand-logo">
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <h1>Teacher Portal</h1>
                    <p>Đăng nhập dành cho Cán bộ giảng dạy</p>
                </div>

                {error && (
                    <div className="error-message">
                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Mã Cán bộ (CBGD) / Email</label>
                        <div className="input-group">
                            <i className="fa-regular fa-id-badge"></i>
                            <input type="text" className="form-control" name="teacher_id" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="input-group">
                            <i className="fa-solid fa-lock"></i>
                            <input type="password" className="form-control" name="password" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" name="remember" /> Ghi nhớ đăng nhập
                        </label>
                    </div>

                    <button type="submit" className="btn-login">
                        Đăng nhập <i className="fa-solid fa-arrow-right-to-bracket"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeacherLogin;