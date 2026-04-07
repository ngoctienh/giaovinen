import React from 'react';
import './QuestionFormModal.css';

const QuestionFormModal = ({ show, onClose, isEditing, formData, handleChange, handleSubmit, subjects }) => {
    if (!show) return null;
    return (
        <div className="qform-modal-overlay">
            <div className="qform-modal-content">
                <div className="qform-modal-header">
                    <h3><i className={isEditing ? "fa-regular fa-pen-to-square" : "fa-solid fa-plus"}></i> {isEditing ? 'Sửa Câu Hỏi' : 'Soạn Câu Hỏi Mới'}</h3>
                    <button type="button" className="btn-close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="qform-grid-2">
                        <div className="qform-group">
                            <label className="qform-label">Môn học</label>
                            <select className="qform-input" name="mon_id" value={formData.mon_id} onChange={handleChange} required>
                                <option value="">-- Chọn môn học --</option>
                                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>)}
                            </select>
                        </div>
                        <div className="qform-group">
                            <label className="qform-label">Độ khó</label>
                            <select className="qform-input" name="do_kho" value={formData.do_kho} onChange={handleChange}>
                                <option value="1">1 - Dễ</option>
                                <option value="2">2 - Trung bình</option>
                                <option value="3">3 - Khó</option>
                            </select>
                        </div>
                    </div>
                    <div className="qform-group">
                        <label className="qform-label">Nội dung câu hỏi *</label>
                        <textarea className="qform-input qform-textarea" name="noi_dung" value={formData.noi_dung} onChange={handleChange} rows="3" required></textarea>
                    </div>
                    <div className="qform-answers-container">
                        <div className="qform-group qform-mb-10"><label className="qform-label">Đáp án A</label><input type="text" className="qform-input" name="dap_an_a" value={formData.dap_an_a} onChange={handleChange} required /></div>
                        <div className="qform-group qform-mb-10"><label className="qform-label">Đáp án B</label><input type="text" className="qform-input" name="dap_an_b" value={formData.dap_an_b} onChange={handleChange} required /></div>
                        <div className="qform-group qform-mb-0"><label className="qform-label">Đáp án C</label><input type="text" className="qform-input" name="dap_an_c" value={formData.dap_an_c} onChange={handleChange} required /></div>
                        <div className="qform-group qform-mb-0"><label className="qform-label">Đáp án D</label><input type="text" className="qform-input" name="dap_an_d" value={formData.dap_an_d} onChange={handleChange} required /></div>
                    </div>
                    <div className="qform-grid-2">
                        <div className="qform-group"><label className="qform-label">Đáp án đúng *</label><select className="qform-input qform-select-correct" name="dap_an_dung" value={formData.dap_an_dung} onChange={handleChange}><option value="A">Đáp án A</option><option value="B">Đáp án B</option><option value="C">Đáp án C</option><option value="D">Đáp án D</option></select></div>
                    </div>
                    <div className="qform-modal-footer">
                        <button type="button" onClick={onClose} className="btn-qform-cancel">Hủy bỏ</button>
                        <button type="submit" className="btn-qform-save">{isEditing ? 'Lưu Cập Nhật' : 'Thêm Câu Hỏi'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default QuestionFormModal;