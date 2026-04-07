const db = require('../config/db');

// [1] LẤY DANH SÁCH ĐỀ THI
const getExams = (req, res) => {
    // Đếm số lượng câu hỏi có trong mỗi đề thi
    const query = `
        SELECT d.id, d.ma_de, d.ten_de, d.mon_id, d.thoigian, d.trang_thai, d.created_at, m.tenmon AS ten_mon,
               (SELECT COUNT(*) FROM de_cauhoi dc WHERE dc.de_id = d.id) AS tong_cau_hoi
        FROM de d
        LEFT JOIN mon m ON d.mon_id = m.id
        ORDER BY d.id DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// [2] TẠO ĐỀ THI MỚI (CÓ RÚT NGẪU NHIÊN)
const addExam = async(req, res) => {
    const { ten_de, mon_id, thoigian, tong_cau_hoi, questionIds, phuong_thuc, so_cau_de, so_cau_tb, so_cau_kho } = req.body;
    // Sinh mã đề ngẫu nhiên VD: DE_1234
    const ma_de = 'DE_' + Math.floor(Math.random() * 10000);

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const sqlExam = `INSERT INTO de (ma_de, ten_de, mon_id, thoigian) VALUES ($1, $2, $3, $4) RETURNING id`;
        const examRes = await client.query(sqlExam, [ma_de, ten_de, mon_id, thoigian]);
        const newExamId = examRes.rows[0].id;

        if (phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng') {
            const sqlRandomQ = `SELECT id, do_kho FROM cauhoi WHERE mon_id = $1`;
            const rowsRes = await client.query(sqlRandomQ, [mon_id]);
            const rows = rowsRes.rows;

            const easyQs = rows.filter(r => r.do_kho === 1);
            const medQs = rows.filter(r => r.do_kho === 2);
            const hardQs = rows.filter(r => r.do_kho === 3);

            const reqEasy = parseInt(so_cau_de) || 0;
            const reqMed = parseInt(so_cau_tb) || 0;
            const reqHard = parseInt(so_cau_kho) || 0;

            if (easyQs.length < reqEasy || medQs.length < reqMed || hardQs.length < reqHard) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Ngân hàng không đủ câu hỏi theo độ khó yêu cầu.\n- Cần: ${reqEasy} Dễ, ${reqMed} TB, ${reqHard} Khó.\n- Hiện có: ${easyQs.length} Dễ, ${medQs.length} TB, ${hardQs.length} Khó.`
                });
            }

            const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
            const selectedQs = [
                ...shuffle(easyQs).slice(0, reqEasy),
                ...shuffle(medQs).slice(0, reqMed),
                ...shuffle(hardQs).slice(0, reqHard)
            ];

            if (selectedQs.length > 0) {
                let placeholders = [];
                let values = [];
                selectedQs.forEach((q, index) => {
                    placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(newExamId, q.id);
                });
                await client.query(`INSERT INTO de_cauhoi (de_id, cauhoi_id) VALUES ${placeholders.join(', ')}`, values);
            }
        } else {
            if (questionIds && questionIds.length > 0) {
                let placeholders = [];
                let values = [];
                questionIds.forEach((qId, index) => {
                    placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(newExamId, qId);
                });
                await client.query(`INSERT INTO de_cauhoi (de_id, cauhoi_id) VALUES ${placeholders.join(', ')}`, values);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Tạo đề thi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi lưu đề thi", error: err.message });
    } finally {
        client.release();
    }
};

// [3] BẬT / TẮT ĐỀ THI (CẬP NHẬT TRẠNG THÁI)
const updateExamStatus = (req, res) => {
    const { trang_thai } = req.body;
    const sql = "UPDATE de SET trang_thai = $1 WHERE id = $2";
    db.query(sql, [trang_thai, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });
        res.json({ success: true, message: "Cập nhật trạng thái thành công" });
    });
};

// [4] CẬP NHẬT NHANH THỜI GIAN LÀM BÀI
const updateExamTime = (req, res) => {
    const { thoigian } = req.body;
    const sql = "UPDATE de SET thoigian = $1 WHERE id = $2";
    db.query(sql, [thoigian, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi server" });
        res.json({ success: true });
    });
};

// [5] CẬP NHẬT TOÀN BỘ ĐỀ THI (SỬA ĐỀ)
const updateExam = async(req, res) => {
    const { ten_de, mon_id, thoigian, tong_cau_hoi, questionIds, phuong_thuc, so_cau_de, so_cau_tb, so_cau_kho } = req.body;
    const examId = req.params.id;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const sqlExam = `UPDATE de SET ten_de = $1, mon_id = $2, thoigian = $3 WHERE id = $4`;
        await client.query(sqlExam, [ten_de, mon_id, thoigian, examId]);

        if (phuong_thuc) {
            await client.query('DELETE FROM de_cauhoi WHERE de_id = $1', [examId]);

            if (phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng') {
                const sqlRandomQ = `SELECT id, do_kho FROM cauhoi WHERE mon_id = $1`;
                const rowsRes = await client.query(sqlRandomQ, [mon_id]);
                const rows = rowsRes.rows;

                const easyQs = rows.filter(r => r.do_kho === 1);
                const medQs = rows.filter(r => r.do_kho === 2);
                const hardQs = rows.filter(r => r.do_kho === 3);

                const reqEasy = parseInt(so_cau_de) || 0;
                const reqMed = parseInt(so_cau_tb) || 0;
                const reqHard = parseInt(so_cau_kho) || 0;

                if (easyQs.length < reqEasy || medQs.length < reqMed || hardQs.length < reqHard) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        message: `Ngân hàng không đủ câu hỏi theo độ khó yêu cầu.\n- Cần: ${reqEasy} Dễ, ${reqMed} TB, ${reqHard} Khó.\n- Hiện có: ${easyQs.length} Dễ, ${medQs.length} TB, ${hardQs.length} Khó.`
                    });
                }

                const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
                const selectedQs = [
                    ...shuffle(easyQs).slice(0, reqEasy),
                    ...shuffle(medQs).slice(0, reqMed),
                    ...shuffle(hardQs).slice(0, reqHard)
                ];

                if (selectedQs.length > 0) {
                    let placeholders = [];
                    let values = [];
                    selectedQs.forEach((q, index) => {
                        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                        values.push(examId, q.id);
                    });
                    await client.query(`INSERT INTO de_cauhoi (de_id, cauhoi_id) VALUES ${placeholders.join(', ')}`, values);
                }
            } else if (phuong_thuc === 'Chọn thủ công từng câu' && questionIds && questionIds.length > 0) {
                let placeholders = [];
                let values = [];
                questionIds.forEach((qId, index) => {
                    placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
                    values.push(examId, qId);
                });
                await client.query(`INSERT INTO de_cauhoi (de_id, cauhoi_id) VALUES ${placeholders.join(', ')}`, values);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Cập nhật đề thi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    } finally {
        client.release();
    }
};

// [6] LẤY DANH SÁCH ID CÂU HỎI THUỘC ĐỀ NÀY
const getExamQuestions = (req, res) => {
    const query = 'SELECT cauhoi_id FROM de_cauhoi WHERE de_id = $1';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results.map(r => r.cauhoi_id));
    });
};

// [7] XÓA ĐỀ THI
const deleteExam = async(req, res) => {
    const examId = req.params.id;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM de_cauhoi WHERE de_id = $1', [examId]);
        await client.query('DELETE FROM de WHERE id = $1', [examId]);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Xóa đề thi thành công!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    } finally {
        client.release();
    }
};

// [8] LẤY TOÀN BỘ CHI TIẾT ĐỀ THI (THÔNG TIN ĐỀ + CÂU HỎI + ĐÁP ÁN) ĐỂ XUẤT WORD
const getExamFullDetails = async(req, res) => {
    const examId = req.params.id;

    const client = await db.connect();
    try {
        const examRes = await client.query('SELECT * FROM de WHERE id = $1', [examId]);
        if (examRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ message: "Không tìm thấy đề thi" });
        }
        const exam = examRes.rows[0];

        const qQuery = `
            SELECT ch.id, ch.nd AS nd_cauhoi, ch.do_kho 
            FROM de_cauhoi dc
            JOIN cauhoi ch ON dc.cauhoi_id = ch.id
            WHERE dc.de_id = $1
        `;
        const questionsRes = await client.query(qQuery, [examId]);
        const questions = questionsRes.rows;

        if (questions.length === 0) {
            client.release();
            return res.json({ exam, questions: [] });
        }

        const questionIds = questions.map(q => q.id);
        const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',');
        const aQuery = `SELECT id, cauhoi_id, ndda AS noi_dung, ky_tu, la_dung FROM dapan WHERE cauhoi_id IN (${placeholders}) ORDER BY ky_tu ASC`;
        const answersRes = await client.query(aQuery, questionIds);
        const answers = answersRes.rows;

        const fullQuestions = questions.map(q => ({
            ...q,
            answers: answers.filter(a => a.cauhoi_id === q.id)
        }));

        res.json({ exam, questions: fullQuestions });
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getExams,
    addExam,
    updateExamStatus,
    updateExamTime,
    updateExam,
    getExamQuestions,
    deleteExam,
    getExamFullDetails
};