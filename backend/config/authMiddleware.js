const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Không có quyền truy cập!" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Không có quyền truy cập!" });

    try {
        const decoded = jwt.verify(token, 'SECRET_KEY');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ!" });
    }
};

module.exports = { verifyToken };