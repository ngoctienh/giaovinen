import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherProfile.css';
import { toast } from 'react-toastify';

const TeacherProfile = () => {
  // 1. Lấy thông tin giáo viên từ localStorage
  const [teacherInfo, setTeacherInfo] = useState(() => {
    const data = localStorage.getItem('teacherInfo');
    return data ? JSON.parse(data) : {};
  });

  const [stats, setStats] = useState({ total_exams: 0, total_questions: 0 });

  // State quản lý Form Hồ sơ
  const [fullname, setFullname] = useState(teacherInfo.fullname || '');
  const [email, setEmail] = useState(teacherInfo.email || '');

  // --- STATE QUẢN LÝ HỘP THOẠI ĐỔI MẬT KHẨU ---
  const [showModal, setShowModal] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');

  // Kéo thống kê từ Database
  useEffect(() => {
    const idGv = teacherInfo.id;
    if (idGv) {
      const fetchStats = async () => {
        try {
          const response = await axios.get(`/teacher/${idGv}/stats`);
          setStats(response.data);
        } catch (error) {
          console.error('Lỗi khi tải thống kê:', error);
        }
      };
      fetchStats();
    }
  }, [teacherInfo.id]);

  // HÀM: LƯU THAY ĐỔI HỒ SƠ
  const handleSaveProfile = async (e) => {
    e.preventDefault(); 
    try {
      const idGv = teacherInfo.id;
      await axios.put(`/teacher/${idGv}/profile`, { 
        fullname: fullname, email: email
      });
      
      const updatedTeacher = { ...teacherInfo, fullname: fullname, email: email };
      localStorage.setItem('teacherInfo', JSON.stringify(updatedTeacher));
      setTeacherInfo(updatedTeacher);
      
      toast.success("Đã lưu thay đổi hồ sơ thành công!");
    } catch (error) {
      toast.error("Lỗi hệ thống khi lưu thông tin!");
    }
  };

  // HÀM: XỬ LÝ SUBMIT ĐỔI MẬT KHẨU TỪ HỘP THOẠI
  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPassError(''); // Xóa lỗi cũ

    // Kiểm tra xem mật khẩu mới và xác nhận có khớp không
    if (passwords.new !== passwords.confirm) {
        setPassError("❌ Mật khẩu xác nhận không khớp với mật khẩu mới!");
        return;
    }

    try {
      const idGv = teacherInfo.id;
      const res = await axios.put(`/teacher/${idGv}/password`, { 
          oldPassword: passwords.old, 
          newPassword: passwords.new 
      });
      
      toast.success(res.data.message); 
      // Thành công thì đóng hộp thoại và xóa trắng các ô nhập
      setShowModal(false);
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (error) {
      setPassError("❌ " + (error.response?.data?.message || "Lỗi khi đổi mật khẩu!")); 
    }
  };

  // Cảnh báo chưa đăng nhập
  if (!teacherInfo || Object.keys(teacherInfo).length === 0) {
    return (
      <div className="profile-error-msg">
        <h2><i className="fa-solid fa-triangle-exclamation"></i> Lỗi phiên đăng nhập!</h2>
        <p>Vui lòng đăng xuất và đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page-header">
        <h1 className="profile-page-title">Hồ sơ Giảng viên</h1>
        <p className="profile-page-subtitle">Quản lý thông tin liên hệ và bảo mật tài khoản cá nhân.</p>
      </div>

      <div className="profile-layout">
        
        {/* Cột Trái: Tóm tắt thông tin */}
        <div className="profile-card profile-summary">
          <div className="profile-avatar-large">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>

          <h2 className="profile-name">{teacherInfo.fullname || 'Chưa cập nhật tên'}</h2>
          <div className="profile-role-badge">Giảng viên chính</div>
          <p className="profile-info-text" style={{ marginBottom: 0 }}><i className="fa-regular fa-envelope"></i> {teacherInfo.email}</p>

          <div className="profile-stats-grid">
            <div className="profile-stat-item">
              <h4 className="profile-stat-number">{stats.total_exams}</h4>
              <p className="profile-stat-label">Đề thi đã tạo</p>
            </div>
            <div className="profile-stat-item">
              <h4 className="profile-stat-number">{stats.total_questions}</h4>
              <p className="profile-stat-label">Câu hỏi đóng góp</p>
            </div>
          </div>
        </div>

        {/* Cột Phải: Biểu mẫu thông tin chi tiết */}
        <div className="profile-card profile-details-card">
          <h3 className="profile-details-title">
            <i className="fa-regular fa-address-card"></i> Thông tin chi tiết
          </h3>

          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label className="profile-form-label">Họ và tên</label>
                <input type="text" className="profile-form-input" value={fullname} onChange={(e) => setFullname(e.target.value)} />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">Mã Cán bộ (CBGD) - Không thể đổi</label>
                <input type="text" className="profile-form-input" defaultValue={teacherInfo.magv} disabled />
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">Email liên hệ</label>
                <input type="email" className="profile-form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="profile-form-actions">
              <button type="button" onClick={() => setShowModal(true)} className="profile-btn-secondary">
                <i className="fa-solid fa-key"></i> Đổi mật khẩu
              </button>
              <button type="submit" className="profile-btn-primary">
                <i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- HỘP THOẠI ĐỔI MẬT KHẨU (MODAL) --- */}
      {showModal && (
        <div className="profile-modal-overlay">
            <div className="profile-modal-content">
                <h3 className="profile-modal-title">
                    <div className="profile-modal-icon"><i className="fa-solid fa-lock"></i></div>
                    Đổi Mật Khẩu
                </h3>
                
                {/* Khu vực hiện thông báo lỗi */}
                {passError && (
                    <div className="profile-error-box">
                        {passError}
                    </div>
                )}

                <form onSubmit={submitPasswordChange}>
                    <div style={{ marginBottom: '15px' }}>
                        <label className="profile-modal-label">Mật khẩu hiện tại <span style={{color: 'red'}}>*</span></label>
                        <input type="password" placeholder="Nhập mật khẩu đang dùng" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} required className="profile-modal-input" />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label className="profile-modal-label">Mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                        <input type="password" placeholder="Nhập mật khẩu mới" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} required minLength="6" className="profile-modal-input" />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label className="profile-modal-label">Xác nhận mật khẩu mới <span style={{color: 'red'}}>*</span></label>
                        <input type="password" placeholder="Nhập lại mật khẩu mới" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} required minLength="6" className="profile-modal-input" />
                    </div>

                    <div className="profile-modal-actions">
                        <button type="button" onClick={() => setShowModal(false)} className="profile-modal-btn-cancel">Hủy bỏ</button>
                        <button type="submit" className="profile-modal-btn-save">Cập nhật</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default TeacherProfile;