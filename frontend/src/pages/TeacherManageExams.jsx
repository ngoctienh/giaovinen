import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TeacherManageExams.css';
import { toast } from 'react-toastify';
import ViewExamModal from '../components/ViewExamModal.jsx';
import EditExamModal from '../components/EditExamModal.jsx';
import QuestionSelectorModal from '../components/QuestionSelectorModal.jsx';

const TeacherManageExams = () => {
    const [exams, setExams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('all'); // Thêm state cho bộ lọc
    
    // Dữ liệu phục vụ Modal Edit
    const [subjects, setSubjects] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        id: '', ten_de: '', mon_id: '', thoigian: '', tong_cau_hoi: '',
        phuong_thuc: 'Rút ngẫu nhiên từ Ngân hàng', so_cau_de: '', so_cau_tb: '', so_cau_kho: ''
    });

    // STATE CHO MODAL CHỌN CÂU HỎI
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    // STATE CHO MODAL XEM ĐỀ THI
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewExamDetails, setViewExamDetails] = useState({ exam: null, questions: [] });

    const fetchData = async () => {
        try {
            const [examsRes, subjectsRes] = await Promise.all([
                axios.get('/teacher/exams'),
                axios.get('/teacher/subjects')
            ]);
            setExams(examsRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // HÀM TÌM KIẾM VÀ LỌC THEO MÔN
    const filteredExams = exams.filter(exam => {
        const matchSearch = exam.ten_de.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (exam.ma_de && exam.ma_de.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchSubject = subjectFilter === 'all' || exam.mon_id === Number(subjectFilter);
        return matchSearch && matchSubject;
    });

    // ==========================================
    // 1. HÀM XỬ LÝ NÚT XÓA ĐỀ THI (THÙNG RÁC)
    // ==========================================
    const handleDelete = async (id, ten_de) => {
        if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn đề thi "${ten_de}" không? Hành động này không thể hoàn tác!`)) {
            try {
                await axios.delete(`/teacher/exams/${id}`);
                toast.success("Đã xóa đề thi thành công!");
                setExams(exams.filter(exam => exam.id !== id)); // Cập nhật lại danh sách sau khi xóa
            } catch (error) {
                toast.error("Lỗi khi xóa đề thi!");
            }
        }
    };

    // ==========================================
    // 2. HÀM XỬ LÝ NÚT XEM ĐỀ THI (CON MẮT)
    // ==========================================
    const handleViewExam = async (exam) => {
        try {
            // Dùng 1 API duy nhất để lấy toàn bộ dữ liệu (rất nhanh và không bị lỗi tải)
            const response = await axios.get(`/teacher/exams/${exam.id}/full`);
            const { questions } = response.data;
            
            setViewExamDetails({ exam, questions });
            setShowViewModal(true);
        } catch (error) {
            toast.error("Lỗi tải chi tiết đề thi!");
        }
    };

    // ==========================================
    // 3. HÀM XỬ LÝ NÚT SỬA ĐỀ THI (CÂY BÚT)
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
            toast.error("Lỗi tải thông tin chi tiết đề thi!");
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

    // Theo dõi: Tự cập nhật số lượng câu hỏi
    useEffect(() => {
        if (editForm.phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng') {
            const total = (Number(editForm.so_cau_de) || 0) + (Number(editForm.so_cau_tb) || 0) + (Number(editForm.so_cau_kho) || 0);
            const newTotal = total === 0 ? '' : total;
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
            toast.success("Cập nhật đề thi & cấu trúc thành công!");
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            const dbError = error.response?.data?.message || "Cập nhật thất bại!";
            toast.error(dbError);
        }
    };

    // ==========================================
    // 4. HÀM XỬ LÝ NÚT NHÂN BẢN (CLONE)
    // ==========================================
    const handleCloneExam = async (exam) => {
        if (!window.confirm(`Bạn có muốn tạo một bản sao của đề thi "${exam.ten_de}" không?`)) return;

        const toastId = toast.loading("Đang nhân bản đề thi...");
        try {
            // Lấy danh sách ID câu hỏi của đề cũ
            const qRes = await axios.get(`/teacher/exams/${exam.id}/questions`);
            const qIds = qRes.data;

            // Tạo Payload y hệt đề cũ, chỉ đổi tên và ép phương thức về Thủ công để giữ nguyên câu hỏi
            const payload = {
                ten_de: exam.ten_de + ' (Bản sao)', 
                mon_id: exam.mon_id,
                thoigian: exam.thoigian, 
                tong_cau_hoi: exam.tong_cau_hoi,
                so_cau_de: 0, so_cau_tb: 0, so_cau_kho: 0,
                questionIds: qIds,
                phuong_thuc: 'Chọn thủ công từng câu'
            };
            
            await axios.post(`/teacher/exams/add`, payload);
            toast.update(toastId, { render: "Nhân bản đề thi thành công!", type: "success", isLoading: false, autoClose: 3000 });
            fetchData();
        } catch (error) {
            toast.update(toastId, { render: "Lỗi khi nhân bản đề thi!", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    // ==========================================
    // 5. HÀM XỬ LÝ NÚT XUẤT WORD (EXPORT)
    // ==========================================
    const handleExportWord = async (exam) => {
        const toastId = toast.loading("Đang tạo file Word...");
        try {
            // Dùng 1 API duy nhất để lấy đầy đủ dữ liệu (khắc phục lỗi rớt kết nối)
            const response = await axios.get(`/teacher/exams/${exam.id}/full`);
            const { questions } = response.data;

            // Hàm xử lý chuỗi để tránh lỗi MS Word cắt ngang tài liệu khi gặp dấu <, >, & hoặc xuống dòng
            const escapeHTML = (str) => {
                if (!str) return '';
                return str.toString()
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;")
                    .replace(/\n/g, "<br/>"); // Giữ nguyên form xuống dòng của câu hỏi
            };

            // Tạo nội dung HTML chuẩn để Word có thể đọc được
            let htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>Đề thi</title></head>
                <body style="font-family: 'Times New Roman', serif; font-size: 14pt;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 16pt;">ĐỀ THI MÔN: ${(exam.ten_mon || '').toUpperCase()}</h2>
                        <p style="margin: 5px 0;"><strong>Tên đề:</strong> ${escapeHTML(exam.ten_de)} | <strong>Mã đề:</strong> ${escapeHTML(exam.ma_de) || '---'}</p>
                        <p style="margin: 5px 0;"><strong>Thời gian làm bài:</strong> ${exam.thoigian} phút</p>
                        <p style="margin: 5px 0;"><i>(Đề thi gồm ${questions.length} câu trắc nghiệm)</i></p>
                    </div>
                    <hr style="border: 1px solid black;" />
                    <div style="margin-top: 20px;">
            `;

            questions.forEach((q, index) => {
                htmlContent += `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0; font-weight: bold;">Câu ${index + 1}: <span style="font-weight: normal;">${escapeHTML(q.nd_cauhoi)}</span></p>
                `;
                q.answers.forEach((ans) => {
                    htmlContent += `<p style="margin: 5px 0 5px 20px;">${ans.ky_tu}. ${escapeHTML(ans.noi_dung)}</p>`;
                });
                htmlContent += `</div>`;
            });

            htmlContent += `
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <p><strong>--- HẾT ---</strong></p>
                    </div>
                </body></html>
            `;

            // Tạo Blob và tải về (Gắn thêm \ufeff để không bị lỗi font Tiếng Việt)
            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `De_Thi_${exam.ma_de || exam.id}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.update(toastId, { render: "Xuất file Word thành công!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error(error);
            toast.update(toastId, { render: "Lỗi xuất file Word!", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <h1>Danh sách Đề thi</h1>
                    <p>Tạo cấu trúc, trộn câu hỏi và quản lý kho đề thi của các môn học.</p>
                </div>
                <Link to="/teacher/add-exam" className="btn btn-primary">
                    <i className="fa-solid fa-plus"></i> Soạn đề thi mới
                </Link>
            </div>

            <div className="data-card">
                <div className="table-toolbar">
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm tên đề thi, mã đề..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        value={subjectFilter} 
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        style={{ padding: '0 15px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#f8fafc', color: 'var(--text-main)', minWidth: '200px', fontWeight: '500', cursor: 'pointer', height: '40px' }}
                    >
                        <option value="all">Tất cả môn học</option>
                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>)}
                    </select>
                </div>

                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>MÃ ĐỀ</th>
                            <th>TÊN ĐỀ THI</th>
                            <th>MÔN HỌC</th>
                            <th>CẤU TRÚC</th>
                            <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExams.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px'}}>Không tìm thấy đề thi nào.</td></tr>
                        ) : filteredExams.map((exam) => (
                            <tr key={exam.id}>
                                <td className="text-ma-de">{exam.ma_de || 'DE_WAIT'}</td>
                                <td>
                                    <div className="text-title">{exam.ten_de}</div>
                                    <div className="text-date">
                                        Tạo ngày: {new Date(exam.created_at).toLocaleDateString('vi-VN')}
                                    </div>
                                </td>
                                <td className="text-subject">{exam.ten_mon}</td>
                                <td>
                                    <div className="text-structure">
                                        <span><i className="fa-solid fa-list-ol"></i> {exam.tong_cau_hoi} câu hỏi</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        {/* NÚT XEM */}
                                        <button className="icon-btn" style={{ color: '#10b981' }} title="Xem chi tiết" onClick={() => handleViewExam(exam)}>
                                            <i className="fa-regular fa-eye"></i>
                                        </button>
                                        {/* NÚT NHÂN BẢN */}
                                        <button className="icon-btn" style={{ color: '#0ea5e9' }} title="Nhân bản đề thi" onClick={() => handleCloneExam(exam)}>
                                            <i className="fa-regular fa-copy"></i>
                                        </button>
                                        {/* NÚT XUẤT WORD */}
                                        <button className="icon-btn" style={{ color: '#8b5cf6' }} title="Xuất file Word" onClick={() => handleExportWord(exam)}>
                                            <i className="fa-regular fa-file-word"></i>
                                        </button>
                                        {/* NÚT SỬA */}
                                        <button className="icon-btn" title="Sửa đề thi" onClick={() => openEditModal(exam)}>
                                            <i className="fa-regular fa-pen-to-square"></i>
                                        </button>
                                        {/* NÚT XÓA */}
                                        <button className="icon-btn delete" title="Xóa đề thi" onClick={() => handleDelete(exam.id, exam.ten_de)}>
                                            <i className="fa-regular fa-trash-can"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL XEM CHI TIẾT ĐỀ THI */}
            <ViewExamModal show={showViewModal} onClose={() => setShowViewModal(false)} viewExamDetails={viewExamDetails} />

            {/* MODAL SỬA ĐỀ THI (Đã được đồng bộ với Tổ chức thi) */}
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

export default TeacherManageExams;