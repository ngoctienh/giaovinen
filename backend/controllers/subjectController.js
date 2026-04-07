const db = require('../config/db');

const getSubjects = (req, res) => {
    const query = 'SELECT id, tenmon AS ten_mon FROM mon';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

module.exports = { getSubjects };