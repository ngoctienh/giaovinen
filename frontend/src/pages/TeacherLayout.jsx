import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './TeacherLayout.css';

const TeacherLayout = () => {
    const navigate = useNavigate();
    const [teacherInfo, setTeacherInfo] = useState({ fullname: '', khoa: '' });
    
    // 1. Thêm State quản lý trạng thái Đóng/Mở của Sidebar (mặc định là Mở)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Chỉ cần lấy thông tin để hiển thị tên giáo viên, không cần check redirect ở đây nữa
    useEffect(() => {
        const info = localStorage.getItem('teacherInfo');
        if (info) {
            setTeacherInfo(JSON.parse(info));
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/teacher/login');
    };

    // 2. Hàm xử lý khi click vào nút Hamburger
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="layout-wrapper">
            {/* 3. Ẩn/Hiện Sidebar dựa vào State */}
            <aside className="sidebar" style={{ display: isSidebarOpen ? 'flex' : 'none' }}>
                <div className="brand"><i className="fa-solid fa-graduation-cap"></i> Teacher Portal</div>
                <div className="teacher-profile">
                    <div className="teacher-avatar"><i className="fa-solid fa-chalkboard-user"></i></div>
                    <div style={{ fontWeight: 600 }}>{teacherInfo.fullname || 'Giảng viên'}</div>
                </div>
               <ul className="nav-menu">
                    <li><NavLink to="/teacher/questions"><i className="fa-solid fa-book-journal-whills"></i> Quản lý câu hỏi</NavLink></li>
                    <li><NavLink to="/teacher/manage-exams"><i className="fa-solid fa-file-invoice"></i> Quản lý đề thi</NavLink></li>
                    <li><NavLink to="/teacher/organize-exams"><i className="fa-solid fa-file-signature"></i> Tổ chức thi</NavLink></li>
                    <li><NavLink to="/teacher/results"><i className="fa-solid fa-chart-line"></i> Thống kê & Kết quả</NavLink></li>
                    <li><NavLink to="/teacher/profile"><i className="fa-solid fa-id-badge"></i> Hồ sơ giáo viên</NavLink></li>
                </ul>
                <div style={{ padding: '15px', marginTop: 'auto' }}>
                    <button onClick={handleLogout} className="btn-logout" style={{ width: '100%' }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-header">
                    {/* 4. Gắn sự kiện onClick vào nút Hamburger */}
                    <div 
                        onClick={toggleSidebar} 
                        style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Đóng/Mở thanh điều hướng"
                    >
                        <i className="fa-solid fa-bars" style={{ fontSize: '20px', color: 'var(--text-muted)' }}></i>
                    </div>
                    <div style={{ fontWeight: 500 }}>Hệ thống Quản lý Đào tạo & Thi cử</div>
                </header>
                <div className="dashboard-body">
                    <Outlet /> 
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;