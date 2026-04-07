const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// [1] XỬ LÝ ĐĂNG NHẬP (LOGIN)
const login = (req, res) => {
    const { teacher_id, password } = req.body;
    // Tìm tài khoản giáo viên bằng magv hoặc email
    const query = 'SELECT * FROM giaovien WHERE magv = $1 OR email = $2';
    db.query(query, [teacher_id, teacher_id], async(err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'Tài khoản không tồn tại!' });

        const teacher = results[0];

        // So sánh mật khẩu (kiểm tra cả mã hóa bcrypt và text thường phòng trường hợp DB cũ)
        const isMatch = await bcrypt.compare(password, teacher.password_hash);
        if (!isMatch && password !== teacher.password_hash) {
            return res.status(401).json({ message: 'Mật khẩu sai!' });
        }

        // Cấp phát token JWT có thời hạn 1 ngày
        const token = jwt.sign({ id: teacher.id }, 'SECRET_KEY', { expiresIn: '1d' });
        const { password_hash, ...info } = teacher;
        // Trả về thông tin giáo viên (đã bỏ password_hash bảo mật) và token
        res.json({ message: 'Thành công', token, teacher: info });
    });
};

module.exports = { login };