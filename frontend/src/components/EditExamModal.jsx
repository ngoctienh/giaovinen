import React from 'react';
import './EditExamModal.css';

const EditExamModal = ({ show, onClose, editForm, handleEditChange, subjects, selectedQuestions, openQuestionSelector, handleSaveEdit }) => {
    if (!show) return null;
    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal-content">
                <div className="edit-modal-header">
                    <h3><i className="fa-regular fa-pen-to-square"></i> Chỉnh Sửa Đề Thi</h3>
                    <button type="button" className="btn-close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <form onSubmit={handleSaveEdit}>
                    <div className="edit-form-group">
                        <label className="edit-form-label">Tên đề thi</label>
                        <input type="text" className="edit-form-input" name="ten_de" value={editForm.ten_de} onChange={handleEditChange} required />
                    </div>
                    <div className="edit-grid-2">
                        <div className="edit-form-group">
                            <label className="edit-form-label">Môn học</label>
                            <select className="edit-form-input" name="mon_id" value={editForm.mon_id} onChange={handleEditChange}>
                                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>)}
                            </select>
                        </div>
                        <div className="edit-form-group">
                            <label className="edit-form-label">Thời gian làm bài (Phút)</label>
                            <input type="number" className="edit-form-input" name="thoigian" value={editForm.thoigian} onChange={handleEditChange} min="1" required />
                        </div>
                    </div>
                    <div className="edit-grid-2 edit-margin-top">
                        <div className="edit-form-group">
                            <label className="edit-form-label">Phương thức cấu trúc</label>
                            <select className="edit-form-input" name="phuong_thuc" value={editForm.phuong_thuc} onChange={handleEditChange}>
                                <option value="Rút ngẫu nhiên từ Ngân hàng">Rút ngẫu nhiên từ Ngân hàng</option>
                                <option value="Chọn thủ công từng câu">Chọn thủ công từng câu</option>
                            </select>
                        </div>
                        <div className="edit-form-group">
                            <label className="edit-form-label">Tổng số câu hỏi</label>
                            <input type="number" className="edit-form-input" name="tong_cau_hoi" value={editForm.tong_cau_hoi} readOnly placeholder="Tự động tính..." />
                        </div>
                    </div>
                    {editForm.phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng' && (
                        <div className="edit-random-grid">
                            <div className="edit-form-group edit-mb-0">
                                <label className="edit-form-label">Số câu Dễ</label>
                                <input type="number" className="edit-form-input" name="so_cau_de" value={editForm.so_cau_de} onChange={handleEditChange} min="0" placeholder="0" />
                            </div>
                            <div className="edit-form-group edit-mb-0">
                                <label className="edit-form-label">Số câu TB</label>
                                <input type="number" className="edit-form-input" name="so_cau_tb" value={editForm.so_cau_tb} onChange={handleEditChange} min="0" placeholder="0" />
                            </div>
                            <div className="edit-form-group edit-mb-0">
                                <label className="edit-form-label">Số câu Khó</label>
                                <input type="number" className="edit-form-input" name="so_cau_kho" value={editForm.so_cau_kho} onChange={handleEditChange} min="0" placeholder="0" />
                            </div>
                        </div>
                    )}
                    {editForm.phuong_thuc === 'Chọn thủ công từng câu' && (
                        <div className={`empty-structure-box ${selectedQuestions.length > 0 ? 'has-questions' : ''}`}>
                            <h4>{selectedQuestions.length > 0 ? `Đã chọn ${selectedQuestions.length} câu hỏi` : 'Đề thi hiện chưa có câu hỏi nào'}</h4>
                            <button type="button" onClick={openQuestionSelector} className="btn-outline-browse">
                                <i className="fa-solid fa-list-check"></i> Chỉnh sửa danh sách câu hỏi
                            </button>
                        </div>
                    )}
                    <div className="edit-modal-footer">
                        <button type="button" onClick={onClose} className="btn-edit-cancel">Hủy bỏ</button>
                        <button type="submit" className="btn-edit-save">Lưu Thay Đổi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default EditExamModal;
