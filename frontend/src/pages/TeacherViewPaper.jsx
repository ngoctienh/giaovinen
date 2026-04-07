import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherViewPaper.css';
import { toast } from 'react-toastify';

const TeacherViewPaper = () => {
    const { id } = useParams(); // Lấy ketqua_id từ URL
    const navigate = useNavigate();
    const [paperData, setPaperData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const response = await axios.get(`/teacher/paper/${id}`);
                setPaperData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Lỗi khi tải bài làm:", error);
                toast.error("Không tìm thấy dữ liệu bài làm này!");
                navigate('/teacher/results');
            }
        };
        fetchPaper();
    }, [id, navigate]);

    if (loading) return <div className="view-paper-loading">Đang tải dữ liệu bài làm...</div>;
    if (!paperData) return null;

    const { info, questions } = paperData;

    return (
        <>
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div className="page-title">
                    <button onClick={() => navigate(-1)} className="view-paper-btn-back">
                        <i className="fa-solid fa-arrow-left"></i> Quay lại
                    </button>
                    <h1 className="view-paper-title">Chi tiết bài làm: {info.fullname} ({info.masv})</h1>
                    <p className="view-paper-subtitle">Đề thi: {info.ten_de}</p>
                </div>
            </div>

            {/* Thông số bài làm */}
            <div className="view-paper-stats-container">
                <div className="view-paper-stat-box">
                    <div className="view-paper-stat-label">Điểm số</div>
                    <div className={`view-paper-stat-value ${info.diem >= 5 ? 'primary' : 'danger'}`}>{info.diem}</div>
                </div>
                <div className="view-paper-stat-box">
                    <div className="view-paper-stat-label">Thời gian làm bài</div>
                    <div className="view-paper-stat-value-text">{info.thoi_gian_lam}</div>
                </div>
                <div className="view-paper-stat-box success">
                    <div className="view-paper-stat-label">Số câu đúng</div>
                    <div className="view-paper-stat-value success">{info.so_cau_dung} câu</div>
                </div>
                <div className="view-paper-stat-box danger">
                    <div className="view-paper-stat-label">Số câu sai</div>
                    <div className="view-paper-stat-value-danger">{info.so_cau_sai} câu</div>
                </div>
            </div>

            {/* Danh sách câu hỏi chi tiết */}
            <div className="view-paper-questions-list">
                {questions.map((q, index) => (
                    <div key={q.cauhoi_id} className="view-paper-question-card" style={{ borderColor: q.sv_lam_dung ? 'var(--success-bg)' : 'var(--danger-bg)', borderWidth: '1px', borderStyle: 'solid' }}>
                        <div className="view-paper-question-header">
                            <span className="view-paper-question-title">Câu hỏi {index + 1} <span className="view-paper-question-code">(Mã CH: {q.ma_ch})</span></span>
                            {q.sv_lam_dung ? (
                                <span className="view-paper-badge-success"><i className="fa-solid fa-check"></i> Trả lời đúng</span>
                            ) : (
                                <span className="view-paper-badge-danger"><i className="fa-solid fa-xmark"></i> Trả lời sai</span>
                            )}
                        </div>
                        
                        <div className="view-paper-question-content">
                            {q.nd_cauhoi}
                        </div>

                        <div className="view-paper-answers-list">
                            {q.answers.map(ans => {
                                // Logic bôi màu đáp án
                                const isCorrectAnswer = ans.la_dung === 1;
                                const isStudentChoice = ans.id === q.dapan_chon_id;
                                
                                let optionClass = "view-paper-answer-option";
                                
                                if (isCorrectAnswer) {
                                    optionClass += " correct";
                                } else if (isStudentChoice && !isCorrectAnswer) {
                                    optionClass += " incorrect";
                                }

                                return (
                                    <div key={ans.id} className={optionClass}>
                                        <div><strong>{ans.ky_tu}.</strong> {ans.noi_dung}</div>
                                        {isStudentChoice && (
                                            <div className="view-paper-answer-meta">
                                                <span className="view-paper-answer-label">SV chọn</span>
                                                {isCorrectAnswer ? <i className="fa-solid fa-circle-check" style={{ fontSize: '16px' }}></i> : <i className="fa-solid fa-circle-xmark" style={{ fontSize: '16px' }}></i>}
                                            </div>
                                        )}
                                        {isCorrectAnswer && !isStudentChoice && (
                                            <div className="view-paper-answer-meta">
                                                <i className="fa-solid fa-check" style={{ fontSize: '16px' }}></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default TeacherViewPaper;