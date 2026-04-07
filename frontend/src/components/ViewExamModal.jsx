import React from 'react';
import './ViewExamModal.css';

const ViewExamModal = ({ show, onClose, viewExamDetails }) => {
    // Nếu thuộc tính show = false hoặc chưa có dữ liệu đề thi thì không hiển thị gì cả
    if (!show || !viewExamDetails.exam) return null; 

    return (
        <div className="view-modal-overlay">
            <div className="view-modal-content">
                <div className="view-modal-header">
                    <h3><i className="fa-regular fa-eye" style={{color: '#10b981'}}></i> Chi Tiết Đề Thi</h3>
                    <button className="btn-close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="view-modal-info">
                    <div className="view-modal-info-item"><p><strong>Tên đề:</strong> {viewExamDetails.exam.ten_de}</p></div>
                    <div className="view-modal-info-item"><p><strong>Mã đề:</strong> {viewExamDetails.exam.ma_de || 'Đang chờ'}</p></div>
                    <div className="view-modal-info-item"><p><strong>Môn học:</strong> {viewExamDetails.exam.ten_mon}</p></div>
                    <div className="view-modal-info-item"><p><strong>Thời gian:</strong> {viewExamDetails.exam.thoigian} phút</p></div>
                    <div className="view-modal-info-item"><p><strong>Tổng số câu:</strong> {viewExamDetails.questions.length} câu</p></div>
                </div>
                <div className="view-modal-body">
                    {viewExamDetails.questions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Đề thi này chưa có câu hỏi nào.</p>
                    ) : (
                        viewExamDetails.questions.map((q, index) => (
                            <div key={q.id} className="view-question-item">
                                <div className="view-question-title">
                                    Câu {index + 1}: <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>({q.ma_ch})</span>
                                </div>
                                <div className="view-question-content" style={{ color: '#334155' }}>{q.nd_cauhoi}</div>
                                
                                <div className="view-answers-grid">
                                    {q.answers && q.answers.map((ans, aIndex) => (
                                        <div key={ans.id} className="view-answer-item" style={{ backgroundColor: ans.la_dung === 1 ? '#ecfdf5' : '#ffffff', border: `1px solid ${ans.la_dung === 1 ? '#10b981' : '#cbd5e1'}`, color: ans.la_dung === 1 ? '#065f46' : '#334155' }}>
                                            <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{ans.ky_tu}.</span>
                                            {ans.noi_dung}
                                            {ans.la_dung === 1 && <i className="fa-solid fa-circle-check" style={{ marginLeft: '6px', color: '#10b981' }} title="Đáp án đúng"></i>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="view-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} className="btn-view-close">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ViewExamModal;