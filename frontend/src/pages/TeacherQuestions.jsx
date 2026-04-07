import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './TeacherQuestions.css';
import { toast } from 'react-toastify';
 // Dùng CSS dùng chung như đã thống nhất
import QuestionFormModal from '../components/QuestionFormModal.jsx';

const TeacherQuestions = () => {
    const teacherInfo = JSON.parse(localStorage.getItem('teacherInfo')) || JSON.parse(localStorage.getItem('teacherData')) || {};
    
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // STATE LỌC & PHÂN TRANG
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Mỗi trang hiển thị 10 câu hỏi

    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentQId, setCurrentQId] = useState(null);
    
    // STATE CHO TÍNH NĂNG IMPORT EXCEL PREVIEW
    const [previewData, setPreviewData] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const initialFormState = {
        mon_id: '', noi_dung: '', do_kho: '1',
        dap_an_a: '', dap_an_b: '', dap_an_c: '', dap_an_d: '', dap_an_dung: 'A'
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const qRes = await axios.get('/teacher/questions', {
                params: {
                    mon_id: subjectFilter,
                    do_kho: difficultyFilter
                }
            });
            setQuestions(qRes.data);
        } catch (error) {
            console.error("Lỗi lấy câu hỏi:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch subjects once on component mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const subRes = await axios.get('/teacher/subjects');
            setSubjects(subRes.data);
            } catch (error) { console.error("Lỗi lấy môn học:", error); }
        };
        fetchSubjects();
    }, []);

    // Fetch questions on initial load and when filters change
    useEffect(() => { fetchQuestions(); }, [subjectFilter, difficultyFilter]);

    // TÍNH TOÁN LỌC DỮ LIỆU
    const filteredQuestions = questions.filter(q => {
        const matchSearch = (q.nd_cauhoi || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (q.ma_ch || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
    });

    // TÍNH TOÁN PHÂN TRANG
    useEffect(() => {
        setCurrentPage(1); // Tự động Reset về trang 1 khi gõ tìm kiếm hoặc đổi môn học
    }, [searchTerm, subjectFilter, difficultyFilter]);

    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const safeCurrentPage = (currentPage > totalPages && totalPages > 0) ? totalPages : currentPage;
    const indexOfLastItem = safeCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleDelete = async (id, ma_ch) => {
        if (window.confirm(`⚠️ Xóa câu hỏi ${ma_ch}?`)) {
            try {
                await axios.delete(`/teacher/questions/${id}`);
                toast.success("Đã xóa thành công!");
                setQuestions(questions.filter(q => q.id !== id));
            } catch (error) { toast.error("Lỗi khi xóa câu hỏi!"); }
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ ...initialFormState, mon_id: subjects.length > 0 ? subjects[0].id : '' });
        setShowModal(true);
    };

    const openEditModal = async (id) => {
        try {
            const res = await axios.get(`/teacher/questions/${id}`);
            const { question, answers } = res.data;
            
            const mapAns = {};
            let correctAns = 'A';
            answers.forEach(ans => {
                mapAns[`dap_an_${ans.ky_tu.toLowerCase()}`] = ans.noi_dung;
                if (ans.la_dung === 1) correctAns = ans.ky_tu;
            });

            setFormData({
                mon_id: question.mon_id, 
                noi_dung: question.nd_cauhoi,
                do_kho: question.do_kho || '1',
                dap_an_a: mapAns.dap_an_a || '', dap_an_b: mapAns.dap_an_b || '',
                dap_an_c: mapAns.dap_an_c || '', dap_an_d: mapAns.dap_an_d || '',
                dap_an_dung: correctAns
            });
            setIsEditing(true);
            setCurrentQId(id);
            setShowModal(true);
        } catch (error) { toast.error("Lỗi tải chi tiết câu hỏi!"); }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, mon_id: Number(formData.mon_id) };

            if (isEditing) {
                await axios.put(`/teacher/questions/${currentQId}`, payload);
                toast.success("Cập nhật câu hỏi thành công!");
            } else {
                await axios.post('/teacher/questions/add', payload);
                toast.success("Đã thêm câu hỏi mới vào Ngân hàng!");
            }
            setShowModal(false);
            fetchQuestions(); 
        } catch (error) { 
            // HIỂN THỊ LỖI THẬT TỪ DATABASE CHỨ KHÔNG BÁO CHUNG CHUNG NỮA
            const dbError = error.response?.data?.error || "Lỗi không xác định";
            toast.error(`Lỗi CSDL: ${dbError}`);
            console.error(error);
        }
    };

    // HÀM TẢI FILE MẪU EXCEL
    const handleDownloadTemplate = () => {
        const templateData = [{
            'Môn ID': 'ID của môn học (vd: 1)',
            'Nội Dung': 'Nội dung câu hỏi',
            'Độ Khó': '1 (Dễ), 2 (TB), 3 (Khó)',
            'Đáp Án A': 'Nội dung đáp án A',
            'Đáp Án B': 'Nội dung đáp án B',
            'Đáp Án C': 'Nội dung đáp án C',
            'Đáp Án D': 'Nội dung đáp án D',
            'Đáp Án Đúng': 'A, B, C, hoặc D'
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, `Template_Import_CauHoi.xlsx`);
    };

    // HÀM XUẤT EXCEL
    const handleExportExcel = async () => {
        if (filteredQuestions.length === 0) {
            toast.warn("Chưa có dữ liệu để xuất!");
            return;
        }

        const toastId = toast.loading("Đang chuẩn bị dữ liệu xuất Excel, vui lòng đợi...");

        try {
            // Tải chi tiết các đáp án của từng câu hỏi
            const detailedPromises = filteredQuestions.map(async (q) => {
                const res = await axios.get(`/teacher/questions/${q.id}`);
                const { answers } = res.data;
                
                const mapAns = {};
                let correctAns = '';
                answers.forEach(ans => {
                    mapAns[`dap_an_${ans.ky_tu.toLowerCase()}`] = ans.noi_dung;
                    if (ans.la_dung === 1) correctAns = ans.ky_tu;
                });

                return {
                    'STT': 0, // Sẽ gán index sau
                    'Nội dung câu hỏi': q.nd_cauhoi,
                    'Môn': q.ten_mon,
                    'Đáp án A': mapAns.dap_an_a || '',
                    'Đáp án B': mapAns.dap_an_b || '',
                    'Đáp án C': mapAns.dap_an_c || '',
                    'Đáp án D': mapAns.dap_an_d || '',
                    'Đáp án đúng': correctAns,
                    'Độ khó': q.do_kho === 3 ? 'Khó' : q.do_kho === 2 ? 'Trung bình' : 'Dễ'
                };
            });

            let exportData = await Promise.all(detailedPromises);
            
            // Cập nhật lại STT theo thứ tự mảng
            exportData = exportData.map((item, index) => ({ ...item, 'STT': index + 1 }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachCauHoi");
            XLSX.writeFile(workbook, `Danh_Sach_Cau_Hoi.xlsx`);
            
            toast.update(toastId, { render: "Xuất Excel thành công!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            toast.update(toastId, { render: "Lỗi tải chi tiết đáp án!", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    // HÀM NHẬP EXCEL
    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                if (data.length === 0) {
                    toast.warn("File Excel trống!");
                    return;
                }

                const parsedData = [];
                for (let row of data) {
                    const payload = {
                        mon_id: Number(row['Môn ID'] || row['mon_id']),
                        noi_dung: row['Nội Dung'] || row['noi_dung'],
                        do_kho: Number(row['Độ Khó'] || row['do_kho'] || 1),
                        dap_an_a: row['Đáp Án A'] || row['dap_an_a'],
                        dap_an_b: row['Đáp Án B'] || row['dap_an_b'],
                        dap_an_c: row['Đáp Án C'] || row['dap_an_c'],
                        dap_an_d: row['Đáp Án D'] || row['dap_an_d'],
                        dap_an_dung: row['Đáp Án Đúng'] || row['dap_an_dung']
                    };
                    
                    if (payload.mon_id && payload.noi_dung && payload.dap_an_a && payload.dap_an_b && payload.dap_an_dung) {
                        parsedData.push(payload);
                    }
                }
                
                if (parsedData.length === 0) {
                    toast.error("Không tìm thấy dữ liệu hợp lệ trong file!");
                } else {
                    setPreviewData(parsedData);
                    setShowPreviewModal(true); // Hiển thị Modal Preview thay vì lưu ngay
                }
            } catch (error) {
                toast.error("Lỗi khi đọc file Excel!");
                console.error(error);
            }
            e.target.value = null; // Reset input
        };
        reader.readAsBinaryString(file);
    };

    // HÀM XÁC NHẬN LƯU TỪ BẢNG PREVIEW VÀO DATABASE
    const handleConfirmImport = async () => {
        let successCount = 0;
        setLoading(true);
        for (let payload of previewData) {
            try {
                await axios.post('/teacher/questions/add', payload);
                successCount++;
            } catch (err) {
                console.error("Lỗi khi thêm câu hỏi từ Excel:", err);
            }
        }
        toast.success(`Đã nhập thành công ${successCount}/${previewData.length} câu hỏi!`);
        setShowPreviewModal(false);
        setPreviewData([]);
        fetchQuestions();
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <h1>Ngân hàng câu hỏi</h1>
                    <p>Quản lý nội dung, thêm, sửa, xóa các câu hỏi trắc nghiệm theo môn học.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleImportExcel} 
                    />
                    <button onClick={handleDownloadTemplate} className="btn btn-outline" title="Tải file mẫu để điền câu hỏi">
                        <i className="fa-solid fa-file-arrow-down"></i> Tải file mẫu
                    </button>
                    <button onClick={handleImportClick} className="btn btn-outline" title="Nhập danh sách câu hỏi từ file Excel">
                        <i className="fa-solid fa-upload"></i> Nhập Excel
                    </button>
                    <button onClick={handleExportExcel} className="btn btn-outline" title="Xuất danh sách câu hỏi hiện tại">
                        <i className="fa-solid fa-download"></i> Xuất Excel
                    </button>
                    <button onClick={openAddModal} className="btn btn-primary">
                        <i className="fa-solid fa-plus"></i> Soạn câu hỏi mới
                    </button>
                </div>
            </div>

            <div className="data-card">
                <div className="table-toolbar" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: 1, minWidth: '250px' }}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Tìm kiếm theo mã câu hỏi, nội dung..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select 
                        value={subjectFilter} 
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        style={{ padding: '0 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', minWidth: '200px', fontWeight: '500', cursor: 'pointer' }}
                    >
                        <option value="all">Tất cả môn học</option>
                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.ten_mon}</option>)}
                    </select>
                    <select 
                        value={difficultyFilter} 
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        style={{ padding: '0 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', color: '#334155', minWidth: '200px', fontWeight: '500', cursor: 'pointer' }}
                    >
                        <option value="all">Tất cả độ khó</option>
                        <option value="1">Dễ</option>
                        <option value="2">Trung bình</option>
                        <option value="3">Khó</option>
                    </select>
                </div>

                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>MÃ CH</th>
                            <th style={{ width: '45%' }}>NỘI DUNG CÂU HỎI</th>
                            <th>MÔN HỌC & ĐỘ KHÓ</th>
                            <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{textAlign: 'center'}}>Đang tải...</td></tr>
                        ) : currentQuestions.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>Không tìm thấy câu hỏi nào.</td></tr>
                        ) : currentQuestions.map((q) => {

                            return (
                                <tr key={q.id}>
                                    <td><span className="q-code">{q.ma_ch}</span></td>
                                    <td>
                                        <div className="q-content">{q.nd_cauhoi}</div>
                                    </td>
                                    <td className="q-subject">
                                        <div>{q.ten_mon}</div>
                                        <span style={{ fontSize: '12px', color: q.do_kho === 3 ? '#ef4444' : q.do_kho === 2 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                                            Mức độ: {q.do_kho === 3 ? 'Khó' : q.do_kho === 2 ? 'Trung bình' : 'Dễ'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button onClick={() => openEditModal(q.id)} className="icon-btn" title="Sửa câu hỏi">
                                                <i className="fa-regular fa-pen-to-square"></i>
                                            </button>
                                            <button onClick={() => handleDelete(q.id, q.ma_ch)} className="icon-btn delete" title="Xóa">
                                                <i className="fa-regular fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* THANH PHÂN TRANG (PAGINATION) */}
                {totalPages > 1 && (
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                        <button 
                            disabled={safeCurrentPage === 1} 
                            onClick={() => paginate(safeCurrentPage - 1)}
                            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: safeCurrentPage === 1 ? '#f8fafc' : 'white', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', color: safeCurrentPage === 1 ? '#94a3b8' : '#475569', fontWeight: '500' }}
                        >
                            <i className="fa-solid fa-chevron-left"></i> Trước
                        </button>
                        
                        <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                            Trang {safeCurrentPage} / {totalPages}
                        </span>

                        <button 
                            disabled={safeCurrentPage === totalPages} 
                            onClick={() => paginate(safeCurrentPage + 1)}
                            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: safeCurrentPage === totalPages ? '#f8fafc' : 'white', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', color: safeCurrentPage === totalPages ? '#94a3b8' : '#475569', fontWeight: '500' }}
                        >
                            Sau <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            <QuestionFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                isEditing={isEditing}
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                subjects={subjects}
            />

            {/* MODAL PREVIEW EXCEL */}
            {showPreviewModal && (
                <div className="qform-modal-overlay">
                    <div className="qform-modal-content" style={{ maxWidth: '900px', width: '90%' }}>
                        <div className="qform-modal-header">
                            <h3><i className="fa-solid fa-table"></i> Xem trước dữ liệu nhập ({previewData.length} câu)</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setShowPreviewModal(false)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                            <table className="custom-table" style={{ border: '1px solid var(--border-color)' }}>
                                <thead>
                                    <tr>
                                        <th>Môn ID</th>
                                        <th>Nội dung</th>
                                        <th>Độ khó</th>
                                        <th>Đáp án A</th>
                                        <th>Đáp án B</th>
                                        <th>Đáp án C</th>
                                        <th>Đáp án D</th>
                                        <th>Đúng</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.mon_id}</td>
                                            <td>{row.noi_dung}</td>
                                            <td>{row.do_kho}</td>
                                            <td>{row.dap_an_a}</td>
                                            <td>{row.dap_an_b}</td>
                                            <td>{row.dap_an_c}</td>
                                            <td>{row.dap_an_d}</td>
                                            <td><strong>{row.dap_an_dung}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="qform-modal-footer">
                            <button type="button" onClick={() => setShowPreviewModal(false)} className="btn-qform-cancel">Hủy bỏ</button>
                            <button type="button" onClick={handleConfirmImport} className="btn-qform-save">Xác nhận Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuestions;