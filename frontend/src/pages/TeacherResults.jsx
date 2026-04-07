import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import './TeacherResults.css'; 
import { toast } from 'react-toastify';

const TeacherResults = () => {
    const [resultsData, setResultsData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get('/teacher/results/summary');
                setResultsData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu thống kê:", error);
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const calculatePercent = (count, total) => {
        if (!total || Number(total) === 0) return 0;
        return Math.round((Number(count) / Number(total)) * 100);
    };

    // Bỏ bộ lọc lớp vì không còn bảng Lớp trong DB
    const filteredData = resultsData;

    // Hàm xuất Excel (Giờ sẽ xuất theo danh sách ĐÃ LỌC)
    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            toast.warn("Chưa có dữ liệu để xuất!");
            return;
        }

        const exportData = filteredData.map((row, index) => ({
            'STT': index + 1,
            'Tên Đề thi / Bài tập': row.ten_de,
            'Môn học': row.ten_mon,
            'Sĩ số lớp': row.si_so,
            'Số lượt đã nộp': row.da_nop,
            'Điểm Trung Bình': row.diem_tb,
            'Số lượng Giỏi (>= 8)': row.gioi,
            'Số lượng Khá (6.5 - 7.9)': row.kha,
            'Số lượng TB (5 - 6.4)': row.trung_binh,
            'Số lượng Yếu (< 5)': row.yeu
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Thong Ke");
        XLSX.writeFile(workbook, `Thong_Ke_Ket_Qua_Thi.xlsx`);
    };

    // 3. Cho 4 thẻ thống kê phía trên tự động chạy theo bộ lọc
    const totalExams = filteredData.length;
    const totalSubmissions = filteredData.reduce((sum, row) => sum + Number(row.da_nop), 0);
    const avgOverall = totalExams > 0 ? (filteredData.reduce((sum, row) => sum + parseFloat(row.diem_tb), 0) / totalExams).toFixed(1) : 0;
    
    const totalGioiKha = filteredData.reduce((sum, row) => sum + Number(row.gioi) + Number(row.kha), 0);
    const rateGioiKha = totalSubmissions > 0 ? Math.round((totalGioiKha / totalSubmissions) * 100) : 0;

    return (
        <>
            <div className="page-header">
                <div className="page-title">
                    <h1>Thống kê & Kết quả thi</h1>
                    <p>Theo dõi điểm số và phân tích chất lượng làm bài của sinh viên theo từng lớp học phần.</p>
                </div>
                <button className="btn-export" onClick={handleExportExcel} style={{ cursor: 'pointer' }}>
                    <i className="fa-solid fa-download"></i> Tải bảng điểm (Excel)
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-primary-light"><i className="fa-solid fa-file-circle-check"></i></div>
                    <div className="stat-info">
                        <h3>{totalExams}</h3>
                        <p>Đề thi đã hoàn tất</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-info-light"><i className="fa-solid fa-users"></i></div>
                    <div className="stat-info">
                        <h3>{totalSubmissions}</h3>
                        <p>Lượt sinh viên nộp bài</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-success-light"><i className="fa-solid fa-star"></i></div>
                    <div className="stat-info">
                        <h3>{avgOverall}</h3>
                        <p>Điểm trung bình chung</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-warning-light"><i className="fa-solid fa-arrow-trend-up"></i></div>
                    <div className="stat-info">
                        <h3>{rateGioiKha}%</h3>
                        <p>Tỉ lệ đạt Khá/Giỏi</p>
                    </div>
                </div>
            </div>

            <div className="data-card">
                <div className="table-toolbar">
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>Danh sách kết quả bài thi gần đây</h3>
                </div>

                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Tên Đề thi / Bài tập</th>
                            <th style={{ textAlign: 'center' }}>Đã nộp</th>
                            <th style={{ textAlign: 'center' }}>Điểm TB</th>
                            <th style={{ width: '30%' }}>Phổ điểm (Giỏi/Khá - TB - Yếu)</th>
                            <th style={{ textAlign: 'center' }}>Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Đang tải dữ liệu từ máy chủ...</td></tr>
                        ) : filteredData.length === 0 ? (
                             <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Chưa có dữ liệu cho lớp học phần này.</td></tr>
                        ) : filteredData.map((row) => {
                            
                            const ptGioiKha = calculatePercent(Number(row.gioi) + Number(row.kha), row.da_nop);
                            const ptTB = calculatePercent(row.trung_binh, row.da_nop);
                            const ptYeu = calculatePercent(row.yeu, row.da_nop);
                            
                            const scoreColor = row.diem_tb >= 8 ? 'var(--primary)' : row.diem_tb >= 5 ? 'var(--warning)' : 'var(--danger)';

                            return (
                                <tr key={row.id}>
                                    <td>
                                        <div className="exam-title">{row.ten_de}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.ten_mon}</div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '500' }}>{row.da_nop} / {row.si_so}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="score-highlight" style={{ color: scoreColor }}>
                                            {row.diem_tb}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="distribution-label">
                                            <span style={{ color: 'var(--success)' }}>{ptGioiKha}%</span>
                                            <span style={{ color: 'var(--warning)' }}>{ptTB}%</span>
                                            <span style={{ color: 'var(--danger)' }}>{ptYeu}%</span>
                                        </div>
                                        <div className="mini-progress-bar">
                                            <div className="segment-good" style={{ width: `${ptGioiKha}%` }}></div>
                                            <div className="segment-avg" style={{ width: `${ptTB}%` }}></div>
                                            <div className="segment-poor" style={{ width: `${ptYeu}%` }}></div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Link to={`/teacher/results/${row.id}`} className="btn-view">
                                            <i className="fa-solid fa-list-check"></i> Xem Bảng Điểm
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}; 

export default TeacherResults;