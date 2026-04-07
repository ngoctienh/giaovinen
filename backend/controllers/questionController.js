const db = require('../config/db');

// [1] LẤY DANH SÁCH CÂU HỎI (CÓ BỘ LỌC)
const getQuestions = (req, res) => {
    const { mon_id, do_kho } = req.query;

    // Câu lệnh SQL cơ bản lấy câu hỏi và nối bảng môn học
    let query = `SELECT ch.id, ch.mon_id, ch.nd AS nd_cauhoi, ch.do_kho, m.tenmon AS ten_mon,
                        CONCAT('Q_', ch.id) AS ma_ch
                 FROM cauhoi ch
                 LEFT JOIN mon m ON ch.mon_id = m.id`;
    const params = [];
    const conditions = [];

    if (mon_id && mon_id !== 'all') {
        params.push(mon_id);
        conditions.push(`ch.mon_id = $${params.length}`);
    }
    if (do_kho && do_kho !== 'all') {
        params.push(do_kho);
        conditions.push(`ch.do_kho = $${params.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY ch.id DESC';
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// [2] THÊM CÂU HỎI MỚI (DÙNG TRANSACTION)
const addQuestion = async(req, res) => {
    const { mon_id, noi_dung, do_kho, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Bước 1: Thêm vào bảng `cauhoi` (PostgreSQL cần RETURNING id)
        const sqlQ = `INSERT INTO cauhoi (mon_id, nd, do_kho) VALUES ($1, $2, $3) RETURNING id`;
        const qRes = await client.query(sqlQ, [mon_id, noi_dung, do_kho || 1]);
        const newQuestionId = qRes.rows[0].id;

        // Chuẩn bị mảng 4 đáp án
        const answers = [
            { nd: dap_an_a, ky_tu: 'A', is_correct: dap_an_dung === 'A' },
            { nd: dap_an_b, ky_tu: 'B', is_correct: dap_an_dung === 'B' },
            { nd: dap_an_c, ky_tu: 'C', is_correct: dap_an_dung === 'C' },
            { nd: dap_an_d, ky_tu: 'D', is_correct: dap_an_dung === 'D' }
        ];

        // Bước 2: Thêm đáp án (Làm phẳng mảng để truyền params hàng loạt)
        const sqlA = `INSERT INTO dapan (cauhoi_id, ndda, ky_tu, la_dung) VALUES ($1,$2,$3,$4), ($5,$6,$7,$8), ($9,$10,$11,$12), ($13,$14,$15,$16)`;
        const flatValues = [];
        answers.forEach(ans => flatValues.push(newQuestionId, ans.nd, ans.ky_tu, ans.is_correct));

        await client.query(sqlA, flatValues);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Thêm câu hỏi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi Server", error: err });
    } finally {
        client.release();
    }
};

// [3] XÓA CÂU HỎI
const deleteQuestion = async(req, res) => {
    const questionId = req.params.id;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM de_cauhoi WHERE cauhoi_id = $1', [questionId]);
        await client.query('DELETE FROM dapan WHERE cauhoi_id = $1', [questionId]);
        await client.query('DELETE FROM cauhoi WHERE id = $1', [questionId]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Xóa câu hỏi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi Server", error: err });
    } finally {
        client.release();
    }
};

// [4] LẤY CHI TIẾT 1 CÂU HỎI (Phục vụ chức năng SỬA)
const getQuestionDetail = (req, res) => {
    const questionId = req.params.id;
    const query = `SELECT ch.id, ch.mon_id, ch.nd AS nd_cauhoi, ch.do_kho FROM cauhoi ch WHERE ch.id = $1`;
    db.query(query, [questionId], (err, qResult) => {
        if (err || qResult.length === 0) return res.status(404).json({ message: "Không tìm thấy câu hỏi" });

        const ansQuery = `SELECT id, ndda AS noi_dung, ky_tu, la_dung FROM dapan WHERE cauhoi_id = $1 ORDER BY ky_tu`;
        db.query(ansQuery, [questionId], (err, ansResult) => {
            if (err) return res.status(500).json({ message: "Lỗi lấy đáp án", error: err });
            res.json({
                question: qResult[0],
                answers: ansResult
            });
        });
    });
};

// [5] CẬP NHẬT CÂU HỎI
const updateQuestion = async(req, res) => {
    const questionId = req.params.id;
    const { mon_id, noi_dung, do_kho, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const sqlQ = `UPDATE cauhoi SET mon_id = $1, nd = $2, do_kho = $3 WHERE id = $4`;
        await client.query(sqlQ, [mon_id, noi_dung, do_kho || 1, questionId]);

        await client.query('DELETE FROM dapan WHERE cauhoi_id = $1', [questionId]);

        const answers = [
            { nd: dap_an_a, ky_tu: 'A', is_correct: dap_an_dung === 'A' },
            { nd: dap_an_b, ky_tu: 'B', is_correct: dap_an_dung === 'B' },
            { nd: dap_an_c, ky_tu: 'C', is_correct: dap_an_dung === 'C' },
            { nd: dap_an_d, ky_tu: 'D', is_correct: dap_an_dung === 'D' }
        ];
        const flatValues = [];
        answers.forEach(ans => flatValues.push(questionId, ans.nd, ans.ky_tu, ans.is_correct));
        const sqlA = `INSERT INTO dapan (cauhoi_id, ndda, ky_tu, la_dung) VALUES ($1,$2,$3,$4), ($5,$6,$7,$8), ($9,$10,$11,$12), ($13,$14,$15,$16)`;
        await client.query(sqlA, flatValues);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Cập nhật câu hỏi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi Server", error: err });
    } finally {
        client.release();
    }
};

module.exports = {
    getQuestions,
    addQuestion,
    deleteQuestion,
    getQuestionDetail,
    updateQuestion
};