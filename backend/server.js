const express = require('express');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);

// Thêm route mặc định để kiểm tra trạng thái server
app.get('/', (req, res) => {
    res.send('Backend Hệ thống quản lý thi trắc nghiệm đang chạy thành công trên Render!');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));