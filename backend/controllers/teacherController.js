const db = require('../config/db');
const bcrypt = require('bcryptjs');

// [1] LẤY THỐNG KÊ TỔNG QUAN (DASHBOARD)
const getStats = (req, res) => {
    const qExams = "SELECT COUNT(*) as total FROM de";
    const qQuestions = "SELECT COUNT(*) as total FROM cauhoi";

    // Đếm tổng số đề thi
    db.query(qExams, (err, r1) => {
        if (err) return res.status(500).json(err);
        // Đếm tổng số câu hỏi
        db.query(qQuestions, (err, r2) => {
            if (err) return res.status(500).json(err);
            res.json({ total_exams: r1[0].total, total_questions: r2[0].total });
        });
    });
};

// [2] CẬP NHẬT HỒ SƠ CÁ NHÂN
const updateProfile = (req, res) => {
    const teacherId = req.params.id;
    const { fullname, email } = req.body;

    const sql = "UPDATE giaovien SET fullname = ?, email = ? WHERE id = ?";
    db.query(sql, [fullname, email, teacherId], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi server khi cập nhật." });
        res.json({ success: true, message: 'Đã lưu thay đổi hồ sơ!' });
    });
};

// [3] ĐỔI MẬT KHẨU CÁ NHÂN
const changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const teacherId = req.params.id;

    // Truy vấn lấy dữ liệu giáo viên hiện tại để kiểm tra
    const sql = 'SELECT * FROM giaovien WHERE id = ?';
    db.query(sql, [teacherId], async(err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Không tìm thấy giáo viên.' });

        const teacher = results[0];

        // Kiểm tra mật khẩu cũ có khớp không
        const isMatch = await bcrypt.compare(oldPassword, teacher.password_hash);
        if (!isMatch && oldPassword !== teacher.password_hash) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // Mã hóa mật khẩu mới (bcrypt)
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Lưu mật khẩu mới đã mã hóa vào CSDL
        const updateSql = 'UPDATE giaovien SET password_hash = ? WHERE id = ?';
        db.query(updateSql, [hashedNewPassword, teacherId], (err, result) => {
            if (err) return res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu.' });
            res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
        });
    });
};

module.exports = { getStats, updateProfile, changePassword };