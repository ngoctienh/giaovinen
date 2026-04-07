import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherAddExam.css'; 
import { toast } from 'react-toastify';
import QuestionSelectorModal from '../components/QuestionSelectorModal.jsx';

const TeacherAddExam = () => {
    const navigate = useNavigate();
    const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo')) || JSON.parse(localStorage.getItem('teacherData')) || {};

    const [subjects, setSubjects] = useState([]);

    const [formData, setFormData] = useState({
        ten_de: '', mon_id: '', thoigian: '', tong_cau_hoi: '',
        phuong_thuc: 'Rút ngẫu nhiên từ Ngân hàng',
        so_cau_de: '', so_cau_tb: '', so_cau_kho: ''
    });

    const [showModal, setShowModal] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    // Gọi API kéo Môn và Lớp từ DB khi mở trang
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const subRes = await axios.get('/teacher/subjects');
                setSubjects(subRes.data);
                
                // Mặc định chọn môn đầu tiên nếu có
                if (subRes.data.length > 0) {
                    setFormData(prev => ({ ...prev, mon_id: subRes.data[0].id }));
                }
            } catch (error) {
                console.error("Lỗi lấy Môn/Lớp:", error);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });

        // Khi đổi môn học, tự động xóa các câu hỏi đã chọn thủ công
        if (name === 'mon_id') {
            setSelectedQuestions([]);
        }
    };

    const openQuestionModal = async () => {
        try {
            const res = await axios.get('/teacher/questions');
            setAvailableQuestions(res.data);
            setShowModal(true);
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

    useEffect(() => {
        if (formData.phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng') {
            const total = (Number(formData.so_cau_de) || 0) + (Number(formData.so_cau_tb) || 0) + (Number(formData.so_cau_kho) || 0);
            setFormData(prev => ({ ...prev, tong_cau_hoi: total === 0 ? '' : total }));
        } else if (formData.phuong_thuc === 'Chọn thủ công từng câu') {
            setFormData(prev => ({ ...prev, tong_cau_hoi: selectedQuestions.length === 0 ? '' : selectedQuestions.length }));
        }
    }, [formData.so_cau_de, formData.so_cau_tb, formData.so_cau_kho, selectedQuestions.length, formData.phuong_thuc]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phuong_thuc === 'Chọn thủ công từng câu' && selectedQuestions.length === 0) {
            toast.warn("Vui lòng Duyệt và tick chọn ít nhất 1 câu hỏi vào đề!"); return;
        }
        if (!formData.ten_de.trim() || !formData.thoigian || !formData.tong_cau_hoi) {
            toast.warn("Vui lòng điền đầy đủ các trường bắt buộc (*)"); return;
        }

        try {
            const payload = {
                ten_de: formData.ten_de,
                mon_id: Number(formData.mon_id),
                thoigian: Number(formData.thoigian),
                tong_cau_hoi: Number(formData.tong_cau_hoi),
                so_cau_de: Number(formData.so_cau_de),
                so_cau_tb: Number(formData.so_cau_tb),
                so_cau_kho: Number(formData.so_cau_kho),
                questionIds: formData.phuong_thuc === 'Chọn thủ công từng câu' ? selectedQuestions : [],
                phuong_thuc: formData.phuong_thuc
            };

            await axios.post('/teacher/exams/add', payload);
            toast.success("Đã tạo đề thi mới thành công!");
            navigate('/teacher/manage-exams'); 
            
        } catch (error) {
            // Bắt và hiển thị đúng lỗi từ Backend trả về
            const dbError = error.response?.data?.message || "Có lỗi xảy ra khi tạo đề thi!";
            toast.error(dbError);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <h1>Tạo Đề Thi Mới</h1>
                    <p>Cấu hình thông tin, thời gian và cấu trúc câu hỏi cho ca thi.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="card-header-title">
                        <div className="icon-box icon-box-primary"><i className="fa-solid fa-circle-info"></i></div>
                        Thông tin cơ bản
                    </div>
                    <div className="form-group">
                        <label>Tên bài thi / Đề thi <span className="required-star">*</span></label>
                        <input type="text" className="form-control" name="ten_de" value={formData.ten_de} onChange={handleChange} placeholder="VD: Kiểm tra Giữa kỳ - Môn Thiết kế phần mềm" required />
                    </div>
                    <div className="grid-2col">
                        <div className="form-group">
                            <label>Môn học (Dữ liệu DB) <span className="required-star">*</span></label>
                            <select className="form-control" name="mon_id" value={formData.mon_id} onChange={handleChange}>
                                {subjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-card">
                    <div className="card-header-title">
                        <div className="icon-box icon-box-warning"><i className="fa-solid fa-clock"></i></div>
                        Thiết lập thời gian thi
                    </div>
                    <div className="grid-3col">
                        <div className="form-group">
                            <label>Thời lượng làm bài (Phút) <span className="required-star">*</span></label>
                            <input type="number" className="form-control" name="thoigian" value={formData.thoigian} onChange={handleChange} placeholder="VD: 60" min="1" required />
                        </div>
                    </div>
                </div>

                <div className="form-card">
                    <div className="card-header-title">
                        <div className="icon-box icon-box-secondary"><i className="fa-solid fa-sliders"></i></div>
                        Cấu trúc đề thi
                    </div>
                    <div className="grid-2col">
                        <div className="form-group">
                            <label>Phương thức lấy câu hỏi</label>
                            <select className="form-control" name="phuong_thuc" value={formData.phuong_thuc} onChange={handleChange}>
                                <option>Rút ngẫu nhiên từ Ngân hàng</option>
                                <option>Chọn thủ công từng câu</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tổng số câu hỏi <span className="required-star">*</span></label>
                            <input type="number" className="form-control" name="tong_cau_hoi" value={formData.tong_cau_hoi} readOnly placeholder="Tự động tính..." required />
                        </div>
                    </div>

                    {formData.phuong_thuc === 'Rút ngẫu nhiên từ Ngân hàng' && (
                        <div className="grid-3col" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Số câu Dễ</label>
                                <input type="number" className="form-control" name="so_cau_de" value={formData.so_cau_de} onChange={handleChange} min="0" placeholder="VD: 10" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Số câu Trung bình</label>
                                <input type="number" className="form-control" name="so_cau_tb" value={formData.so_cau_tb} onChange={handleChange} min="0" placeholder="VD: 10" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Số câu Khó</label>
                                <input type="number" className="form-control" name="so_cau_kho" value={formData.so_cau_kho} onChange={handleChange} min="0" placeholder="VD: 10" />
                            </div>
                        </div>
                    )}

                    {formData.phuong_thuc === 'Chọn thủ công từng câu' && (
                        <div className="empty-structure-box">
                            <div className="empty-icon">
                                <i className={selectedQuestions.length > 0 ? "fa-solid fa-box-check" : "fa-solid fa-box-open"}></i>
                            </div>
                            <h4 className="empty-title">
                                {selectedQuestions.length > 0 ? `Đã chọn ${selectedQuestions.length} câu hỏi` : 'Bạn chưa chọn câu hỏi nào'}
                            </h4>
                            <p className="empty-desc">
                                {selectedQuestions.length > 0 ? 'Click vào nút bên dưới để chỉnh sửa lại danh sách.' : 'Nhấn nút Duyệt để chọn câu hỏi cụ thể cho đề thi này.'}
                            </p>
                            <button type="button" onClick={openQuestionModal} className="btn-outline-browse">
                                <i className="fa-solid fa-list-check"></i> Duyệt Ngân hàng câu hỏi
                            </button>
                        </div>
                    )}
                </div>

                <div className="add-exam-actions-footer">
                    <button type="button" onClick={() => navigate('/teacher/manage-exams')} className="btn btn-secondary">Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary"><i className="fa-solid fa-floppy-disk"></i> Lưu Đề Thi</button>
                </div>
            </form>

            {/* MODAL DUYỆT CÂU HỎI */}
            <QuestionSelectorModal
                show={showModal}
                onClose={() => setShowModal(false)}
                availableQuestions={availableQuestions}
                selectedQuestions={selectedQuestions}
                onToggleQuestion={handleToggleQuestion}
                subjects={subjects}
                initialSubject={formData.mon_id}
            />
        </div>
    );
};

export default TeacherAddExam;