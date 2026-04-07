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

const PORT = 5000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));