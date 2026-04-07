const { Pool } = require('pg');
require('dotenv').config(); // Load biến môi trường từ file .env

const pool = new Pool({
    // Sử dụng chuỗi kết nối an toàn từ file .env
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err, client) => {
    console.error('Lỗi kết nối CSDL Supabase (PostgreSQL):', err);
});

module.exports = {
    // Wrapper giữ nguyên cấu trúc callback cũ để giảm thiểu lỗi ở các file khác
    query: (text, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        return pool.query(text, params, (err, res) => {
            if (callback) callback(err, res ? res.rows : [], res);
        });
    },
    connect: () => pool.connect()
};