import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx'; // Import thư viện Excel
import './TeacherResultDetail.css';
import { toast } from 'react-toastify';

const TeacherResultDetail = () => {
    const { id } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await axios.get(`/teacher/results/${id}`);
                setStudents(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi khi tải chi tiết bảng điểm:", error);
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // HÀM 1: XỬ LÝ XUẤT EXCEL
    const handleExportExcel = () => {
        if (students.length === 0) {
            toast.warn("Chưa có dữ liệu để xuất!");
            return;
        }

        // 1. Nhào nặn dữ liệu cho đẹp trước khi đưa vào Excel
        const exportData = students.map((s, index) => ({
            'STT': index + 1,
            'Họ và Tên': s.fullname,
            'Thời gian làm bài': s.diem === null ? 'Không thi' : s.thoi_gian_lam,
            'Số câu đúng': s.diem === null ? '-' : `${s.so_cau_dung} / ${Number(s.so_cau_dung) + Number(s.so_cau_sai)}`,
            'Điểm số': s.diem === null ? '0' : s.diem,
            'Trạng thái': s.diem === null ? 'Vắng' : (s.diem >= 5 ? 'Đạt' : 'Chưa đạt')
        }));

        // 2. Tạo sheet và tải file xuống
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bang Diem");
        XLSX.writeFile(workbook, `Bang_Diem_MaDe_${id}.xlsx`);
    };

    // HÀM 2: XỬ LÝ IN BẢNG ĐIỂM
    const handlePrint = () => {
        window.print();
    };

    const totalStudents = students.length;
    const submittedCount = students.filter(s => s.diem !== null).length;
    const passedCount = students.filter(s => s.diem !== null && s.diem >= 5).length;

    return (
        <>
            <div className="page-header result-detail-header-row">
                <div className="page-title">
                    <Link to="/teacher/results" className="result-detail-back-link">
                        <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách
                    </Link>
                    <h1 className="result-detail-title">Chi tiết Bảng điểm (Mã Đề: {id})</h1>
                    <p className="result-detail-subtitle">Danh sách sinh viên và kết quả làm bài thi trắc nghiệm.</p>
                </div>
                
                <div className="result-detail-actions">
                    <button onClick={handlePrint} className="btn btn-outline result-detail-btn-print">
                        <i className="fa-solid fa-print"></i> In bảng điểm
                    </button>
                    <button onClick={handleExportExcel} className="btn btn-primary result-detail-btn-export">
                        <i className="fa-solid fa-file-excel"></i> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="result-detail-stats-row">
                <div className="result-detail-stat-box">
                    <div className="result-detail-stat-icon info"><i className="fa-solid fa-users"></i></div>
                    <div>
                        <div className="result-detail-stat-label">Sĩ số lớp</div>
                        <div className="result-detail-stat-value">{totalStudents}</div>
                    </div>
                </div>
                <div className="result-detail-stat-box">
                    <div className="result-detail-stat-icon primary"><i className="fa-solid fa-file-signature"></i></div>
                    <div>
                        <div className="result-detail-stat-label">Đã nộp bài</div>
                        <div className="result-detail-stat-value">{submittedCount}</div>
                    </div>
                </div>
                <div className="result-detail-stat-box">
                    <div className="result-detail-stat-icon success"><i className="fa-solid fa-check-double"></i></div>
                    <div>
                        <div className="result-detail-stat-label">Số lượng Đạt {`(>= 5)`}</div>
                        <div className="result-detail-stat-value">{passedCount}</div>
                    </div>
                </div>
            </div>

            <div className="data-card result-detail-table-container">
                <table className="result-detail-table">
                    <thead>
                        <tr>
                            <th className="result-detail-th left">Họ và Tên</th>
                            <th className="result-detail-th center">Thời gian làm</th>
                            <th className="result-detail-th center">Số câu đúng</th>
                            <th className="result-detail-th center">Điểm số</th>
                            <th className="result-detail-th center">Trạng thái</th>
                            <th className="result-detail-th center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="6" className="result-detail-loading">Đang tải danh sách...</td></tr>
                        ) : students.map((student, index) => {
                            const isAbsent = student.diem === null;
                            const isPassed = !isAbsent && student.diem >= 5;

                            return (
                                <tr key={index} className={`result-detail-tr ${isAbsent ? 'absent' : 'present'}`}>
                                    <td className="result-detail-td fullname" style={{ color: isAbsent ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                        {student.fullname}
                                    </td>
                                    
                                    {isAbsent ? (
                                        <>
                                            <td className="result-detail-td center"><i className="result-detail-absent-text">Không tham gia thi</i></td>
                                            <td className="result-detail-td center result-detail-muted-dash">-</td>
                                            <td className="result-detail-td center result-detail-muted-dash">-</td>
                                            <td className="result-detail-td center">
                                                <span className="result-detail-badge-absent">Vắng</span>
                                            </td>
                                            <td className="result-detail-td center">
                                                <button className="result-detail-btn-disabled" disabled>
                                                    <i className="fa-regular fa-eye-slash"></i>
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="result-detail-td center result-detail-time">
                                                {student.thoi_gian_lam}
                                            </td>
                                            <td className="result-detail-td center">
                                                <span className="result-detail-correct">{student.so_cau_dung}</span> 
                                                <span className="result-detail-total"> / {Number(student.so_cau_dung) + Number(student.so_cau_sai)}</span>
                                            </td>
                                            <td className="result-detail-td center">
                                                <span className={`result-detail-score ${isPassed ? 'passed' : 'failed'}`}>
                                                    {student.diem}
                                                </span>
                                            </td>
                                            <td className="result-detail-td center">
                                                {isPassed ? (
                                                    <span className="result-detail-badge-passed">Đạt</span>
                                                ) : (
                                                    <span className="result-detail-badge-failed">Chưa đạt</span>
                                                )}
                                            </td>
                                            <td className="result-detail-td center">
                                                <Link to={`/teacher/view-paper/${student.ketqua_id}`} className="result-detail-btn-view" title="Xem chi tiết bài làm">
                                                    <i className="fa-regular fa-eye"></i>
                                                </Link>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TeacherResultDetail;