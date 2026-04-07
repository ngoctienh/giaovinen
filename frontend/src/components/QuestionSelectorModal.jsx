import React, { useState, useEffect } from 'react';
import './QuestionSelectorModal.css';

const QuestionSelectorModal = ({ show, onClose, availableQuestions, selectedQuestions, onToggleQuestion, subjects, initialSubject = '' }) => {
    const [subjectFilter, setSubjectFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');

    useEffect(() => {
        if (show) setSubjectFilter(initialSubject);
    }, [show, initialSubject]);

    if (!show) return null;

    const filteredQuestions = availableQuestions.filter(q => 
        (difficultyFilter === '' || q.do_kho === Number(difficultyFilter)) && 
        (subjectFilter === '' || q.mon_id === Number(subjectFilter))
    );

    return (
        <div className="question-modal-overlay">
            <div className="question-modal-content">
                <div className="question-modal-header">
                    <h3 className="question-modal-title">Chỉnh sửa danh sách câu hỏi</h3>
                    <div className="question-modal-badge">Đã chọn: {selectedQuestions.length}</div>
                </div>

                <div className="question-filter-group">
                    <select className="question-filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                        <option value="">Tất cả môn học</option>
                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>)}
                    </select>
                    <select className="question-filter-select" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
                        <option value="">Tất cả độ khó</option>
                        <option value="1">Mức độ: Dễ</option>
                        <option value="2">Mức độ: Trung bình</option>
                        <option value="3">Mức độ: Khó</option>
                    </select>
                </div>

                <div className="question-list-container">
                    {filteredQuestions.length === 0 ? (
                        <p className="question-empty-msg">Không có câu hỏi nào phù hợp.</p>
                    ) : filteredQuestions.map((q) => {
                        const isSelected = selectedQuestions.includes(q.id);
                        return (
                            <label key={q.id} className={`question-item ${isSelected ? 'selected' : ''}`}>
                                <input type="checkbox" className="question-checkbox" checked={isSelected} onChange={() => onToggleQuestion(q.id)} />
                                <div>
                                    <div className="question-text-content"><span className="question-id-highlight">{q.ma_ch || `Q_${q.id}`}:</span> {q.nd_cauhoi}</div>
                                    <div className="question-meta-info"><span style={{ color: q.do_kho === 3 ? '#ef4444' : q.do_kho === 2 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>Mức độ: {q.do_kho === 3 ? 'Khó' : q.do_kho === 2 ? 'Trung bình' : 'Dễ'}</span></div>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="question-modal-footer">
                    <button type="button" className="btn-question-done" onClick={onClose}>Xong ({selectedQuestions.length})</button>
                </div>
            </div>
        </div>
    );
};
export default QuestionSelectorModal;