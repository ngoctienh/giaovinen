import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TeacherOrganizeExams.css';
import { toast } from 'react-toastify';
import EditExamModal from '../components/EditExamModal.jsx';
import QuestionSelectorModal from '../components/QuestionSelectorModal.jsx';

const TeacherOrganizeExams = () => {
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // STATE CHO MODAL SỬA ĐỀ
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        id: '', ten_de: '', mon_id: '', thoigian: '', tong_cau_hoi: '',
        phuong_thuc: 'Rút ngẫu nhiên từ Ngân hàng', so_cau_de: '', so_cau_tb: '', so_cau_kho: ''
    });

    // STATE CHO MODAL CHỌN CÂU HỎI
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    const fetchData = async () => {
        try {
            const [examsRes, subjectsRes] = await Promise.all([
                axios.get('/teacher/exams'),
                axios.get('/teacher/subjects')
            ]);
            setExams(examsRes.data);
            setSubjects(subjectsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, []);

    const handleEditTime = async (examId, currentTime) => {
        const newTime = prompt(`Nhập thời gian làm bài mới (Phút)\nThời gian hiện tại: ${currentTime} phút`, currentTime);
        if (!newTime || isNaN(newTime) || Number(newTime) <= 0) return;
        try {
            await axios.patch(`/teacher/exams/${examId}/time`, { thoigian: Number(newTime) });
            setExams(exams.map(exam => exam.id === examId ? { ...exam, thoigian: Number(newTime) } : exam));
            toast.success("Cập nhật thời gian thành công!");
        } catch (error) { 
            toast.error("Lỗi cập nhật thời gian!"); 
        }
    };

    const handleToggleStatus = async (examId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            await axios.patch(`/teacher/exams/${examId}/status`, { trang_thai: newStatus });
            setExams(exams.map(exam => exam.id === examId ? { ...exam, trang_thai: newStatus } : exam));
            toast.success("Cập nhật trạng thái thành công!");
        } catch (error) { 
            toast.error("Lỗi cập nhật trạng thái!"); 
        }
    };

    // ==========================================
    // MỞ POPUP SỬA ĐỀ & LẤY CÂU HỎI ĐÃ CHỌN
    // ==========================================
    const openEditModal = async (exam) => {
        try {
            const qRes = await axios.get(`/teacher/exams/${exam.id}/questions`);
            const fetchedQIds = qRes.data; // Dữ liệu từ Backend đã là mảng ID [1, 2, 3]
            setSelectedQuestions(fetchedQIds);

            setEditForm({
                id: exam.id,
                ten_de: exam.ten_de,
                mon_id: exam.mon_id || (subjects.length > 0 ? subjects[0].id : ''),
                thoigian: exam.thoigian,
                tong_cau_hoi: exam.tong_cau_hoi,
                phuong_thuc: fetchedQIds.length > 0 ? 'Chọn thủ công từng câu' : 'Rút ngẫu nhiên từ Ngân hàng',
                so_cau_de: '', so_cau_tb: '', so_cau_kho: ''
            });
            setShowEditModal(true);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu câu hỏi chi tiết:", error);
            toast.error("Lỗi tải thông tin đề thi!");
        }
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newFormState = { ...editForm, [name]: type === 'checkbox' ? checked : value };

        if (name === 'phuong_thuc' && value === 'Rút ngẫu nhiên từ Ngân hàng') {
            newFormState.tong_cau_hoi = '';
            newFormState.so_cau_de = '';
            newFormState.so_cau_tb = '';
            newFormState.so_cau_kho = '';
        }

        // Khi đổi môn học, tự động xóa các câu hỏi đã chọn thủ công
        if (name === 'mon_id') {
            setSelectedQuestions([]);
        }

        setEditForm(newFormState);
    };

    // Theo dõi: Tự cập nhật số lượng
    useEffect(() => {
        if (editForm.phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng') {
            const total = (Number(editForm.so_cau_de) || 0) + (Number(editForm.so_cau_tb) || 0) + (Number(editForm.so_cau_kho) || 0);
            const newTotal = total === 0 ? '' : total;
            // Chỉ update nếu thực sự có thay đổi để tránh infinite loop
            if (editForm.tong_cau_hoi !== newTotal) {
                setEditForm(prev => ({ ...prev, tong_cau_hoi: newTotal }));
            }
        } else if (editForm.phuong_thuc === 'Chọn thủ công từng câu') {
            const newTotal = selectedQuestions.length === 0 ? '' : selectedQuestions.length;
            if (editForm.tong_cau_hoi !== newTotal) {
                setEditForm(prev => ({ ...prev, tong_cau_hoi: newTotal }));
            }
        }
    }, [editForm.so_cau_de, editForm.so_cau_tb, editForm.so_cau_kho, selectedQuestions.length, editForm.phuong_thuc, editForm.tong_cau_hoi]);

    const openQuestionSelector = async () => {
        try {
            const res = await axios.get('/teacher/questions');
            setAvailableQuestions(res.data);
            setShowQuestionModal(true);
        } catch (error) { 
            toast.error("Lỗi tải ngân hàng câu hỏi!"); 
        }
    };

    const handleToggleQuestion = (id) => {
        if (selectedQuestions.includes(id)) {
            setSelectedQuestions(selectedQuestions.filter(qId => qId !== id)); 
        } else {
            setSelectedQuestions([...selectedQuestions, id]); 
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (editForm.phuong_thuc === 'Chọn thủ công từng câu' && selectedQuestions.length === 0) {
            toast.warn("Đề thi phải có ít nhất 1 câu hỏi nếu chọn thủ công!"); 
            return;
        }

        if (!editForm.ten_de.trim() || !editForm.thoigian || !editForm.tong_cau_hoi) {
            toast.warn("Vui lòng điền đầy đủ các thông tin bắt buộc!"); 
            return;
        }

        try {
            const payload = {
                ten_de: editForm.ten_de, 
                mon_id: Number(editForm.mon_id),
                thoigian: Number(editForm.thoigian), 
                tong_cau_hoi: Number(editForm.tong_cau_hoi),
                so_cau_de: Number(editForm.so_cau_de),
                so_cau_tb: Number(editForm.so_cau_tb),
                so_cau_kho: Number(editForm.so_cau_kho),
                questionIds: editForm.phuong_thuc === 'Chọn thủ công từng câu' ? selectedQuestions : [],
                phuong_thuc: editForm.phuong_thuc
            };
            
            await axios.put(`/teacher/exams/${editForm.id}`, payload);
            toast.success("Cập nhật đề thi & câu hỏi thành công!");
            setShowEditModal(false);
            fetchData(); 
        } catch (error) { 
            toast.error("Cập nhật thất bại!"); 
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <h1>Tổ chức & Quản lý Đề thi</h1>
                    <p>Tạo cấu trúc đề, thiết lập thời gian làm bài và đóng/mở ca thi cho sinh viên.</p>
                </div>
                <Link to="/teacher/add-exam" className="btn btn-primary">
                    <i className="fa-solid fa-plus"></i> Soạn đề thi mới
                </Link>
            </div>

            <div className="data-card">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>THÔNG TIN ĐỀ THI</th>
                            <th>THỜI GIAN THI</th>
                            <th>TRẠNG THÁI</th>
                            <th style={{ textAlign: 'center' }}>TÙY CHỈNH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
                        ) : exams.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Chưa có đề thi nào. Hãy tạo mới!</td></tr>
                        ) : exams.map((exam) => (
                                <tr key={exam.id}>
                                    <td>
                                        <div className="exam-main-title">{exam.ten_de}</div>
                                        <div className="exam-meta">
                                            <span><i className="fa-solid fa-book"></i> {exam.ten_mon}</span>
                                            <span><i className="fa-regular fa-file-lines"></i> {exam.tong_cau_hoi} câu</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="subject-title" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                                            <i className="fa-regular fa-clock"></i> {exam.thoigian} phút
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleToggleStatus(exam.id, exam.trang_thai)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                backgroundColor: exam.trang_thai === 1 ? '#ecfdf5' : '#f1f5f9',
                                                color: exam.trang_thai === 1 ? '#10b981' : '#64748b',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                width: 'fit-content'
                                            }}
                                        >
                                            <i className={`fa-solid ${exam.trang_thai === 1 ? 'fa-toggle-on' : 'fa-toggle-off'}`} style={{fontSize: '18px'}}></i>
                                            {exam.trang_thai === 1 ? 'Đang Mở' : 'Đã Đóng'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" title="Sửa thời gian" onClick={() => handleEditTime(exam.id, exam.thoigian)}><i className="fa-regular fa-stopwatch"></i></button>
                                            <button className="icon-btn" title="Sửa toàn bộ đề" onClick={() => openEditModal(exam)}><i className="fa-regular fa-pen-to-square"></i></button>
                                        </div>
                                    </td>
                                </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL SỬA ĐỀ THI */}
            <EditExamModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                editForm={editForm}
                handleEditChange={handleEditChange}
                subjects={subjects}
                selectedQuestions={selectedQuestions}
                openQuestionSelector={openQuestionSelector}
                handleSaveEdit={handleSaveEdit}
            />

            {/* MODAL DUYỆT CÂU HỎI BÊN TRONG MODAL SỬA */}
            <QuestionSelectorModal
                show={showQuestionModal}
                onClose={() => setShowQuestionModal(false)}
                availableQuestions={availableQuestions}
                selectedQuestions={selectedQuestions}
                onToggleQuestion={handleToggleQuestion}
                subjects={subjects}
                initialSubject={editForm.mon_id}
            />
        </div>
    );
};

export default TeacherOrganizeExams;