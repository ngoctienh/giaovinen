const db = require('../config/db');

// [1] THỐNG KÊ KẾT QUẢ TỔNG QUAN (Danh sách đề)
const getResultsSummary = (req, res) => {
    // Đếm số lượng sinh viên đã nộp bài, phân loại điểm Giỏi, Khá, TB, Yếu
    const query = `
        SELECT
            d.id,
            d.ten_de,
            m.tenmon AS ten_mon,
            (SELECT COUNT(DISTINCT sinhvien_id) FROM ketqua WHERE de_id = d.id) AS da_nop,
            (SELECT COUNT(*) FROM sinhvien) AS si_so,
            COALESCE(ROUND(CAST(AVG(kq.diem) AS numeric), 1), 0) AS diem_tb,
            COALESCE(SUM(CASE WHEN kq.diem >= 8 THEN 1 ELSE 0 END), 0) AS gioi,
            COALESCE(SUM(CASE WHEN kq.diem >= 6.5 AND kq.diem < 8 THEN 1 ELSE 0 END), 0) AS kha,
            COALESCE(SUM(CASE WHEN kq.diem >= 5 AND kq.diem < 6.5 THEN 1 ELSE 0 END), 0) AS trung_binh,
            COALESCE(SUM(CASE WHEN kq.diem < 5 THEN 1 ELSE 0 END), 0) AS yeu
        FROM de d
        LEFT JOIN mon m ON d.mon_id = m.id
        LEFT JOIN ketqua kq ON d.id = kq.de_id
        GROUP BY d.id, d.ten_de, m.tenmon
        ORDER BY d.id DESC;
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server", error: err });
        res.json(results);
    });
};

// [2] XEM CHI TIẾT ĐIỂM CỦA 1 ĐỀ THI (Danh sách SV)
const getResultDetails = (req, res) => {
    const de_id = req.params.id;
    const query = `
        SELECT
            sv.id, 
            -- Hàm tạo ảo mã SV nếu bảng sinhvien chỉ có id (ví dụ: SV00001)
            CONCAT('SV', LPAD(CAST(sv.id AS text), 5, '0')) AS masv,
            sv.fullname,
            kq.id as ketqua_id, kq.diem, kq.socaudung as so_cau_dung, kq.socausai as so_cau_sai,
            CONCAT(
                FLOOR(EXTRACT(EPOCH FROM (kq.ketthuc - kq.batdau)) / 60), ' phút ',
                MOD(CAST(EXTRACT(EPOCH FROM (kq.ketthuc - kq.batdau)) AS numeric), 60), ' giây'
            ) as thoi_gian_lam
        FROM sinhvien sv
        LEFT JOIN ketqua kq ON sv.id = kq.sinhvien_id AND kq.de_id = $1
        ORDER BY sv.id
    `;
    db.query(query, [de_id], (err, results) => {
        if (err) return res.status(500).json({ message: "Lỗi server", error: err });
        res.json(results);
    });
};

// [3] XEM CHI TIẾT BÀI LÀM CỦA 1 SINH VIÊN (Từng câu)
const getPaperDetails = (req, res) => {
    const ketqua_id = req.params.ketqua_id;

    // Lấy thông tin tổng quát bài làm (điểm, thời gian)
    const infoQuery = `
        SELECT 
            kq.diem, kq.socaudung as so_cau_dung, kq.socausai as so_cau_sai,
            CONCAT(
                FLOOR(EXTRACT(EPOCH FROM (kq.ketthuc - kq.batdau)) / 60), ' phút ',
                MOD(CAST(EXTRACT(EPOCH FROM (kq.ketthuc - kq.batdau)) AS numeric), 60), ' giây'
            ) as thoi_gian_lam,
            d.ten_de,
            sv.fullname,
            CONCAT('SV', LPAD(CAST(sv.id AS text), 5, '0')) AS masv
        FROM ketqua kq
        JOIN de d ON kq.de_id = d.id
        JOIN sinhvien sv ON kq.sinhvien_id = sv.id
        WHERE kq.id = $1
    `;

    db.query(infoQuery, [ketqua_id], (err, infoResult) => {
        if (err || infoResult.length === 0) return res.status(500).json({ message: "Lỗi lấy thông tin bài làm" });

        // Lấy chi tiết lịch sử chọn đáp án của sinh viên đó
        const questionsQuery = `
            SELECT 
                ch.id AS cauhoi_id, ch.nd AS nd_cauhoi, CONCAT('Q_', ch.id) AS ma_ch,
                kqc.dapan_id AS dapan_chon_id,
                kqc.la_dung AS sv_lam_dung,
                da.id AS dapan_id, da.ky_tu, da.ndda AS noi_dung, da.la_dung
            FROM ketquachitiet kqc
            JOIN cauhoi ch ON kqc.cauhoi_id = ch.id
            JOIN dapan da ON ch.id = da.cauhoi_id
            WHERE kqc.ketqua_id = $1
        `;

        db.query(questionsQuery, [ketqua_id], (err, qResults) => {
            if (err) return res.status(500).json({ message: "Lỗi lấy chi tiết đáp án" });

            // Gộp các đáp án lại thành 1 mảng lồng trong object câu hỏi
            const questionsMap = {};
            qResults.forEach(row => {
                if (!questionsMap[row.cauhoi_id]) {
                    questionsMap[row.cauhoi_id] = {
                        cauhoi_id: row.cauhoi_id,
                        ma_ch: row.ma_ch,
                        nd_cauhoi: row.nd_cauhoi,
                        sv_lam_dung: row.sv_lam_dung === 1,
                        dapan_chon_id: row.dapan_chon_id,
                        answers: []
                    };
                }
                questionsMap[row.cauhoi_id].answers.push({
                    id: row.dapan_id,
                    ky_tu: row.ky_tu,
                    noi_dung: row.noi_dung,
                    la_dung: row.la_dung
                });
            });

            res.json({ info: infoResult[0], questions: Object.values(questionsMap) });
        });
    });
};

module.exports = {
    getResultsSummary,
    getResultDetails,
    getPaperDetails
};