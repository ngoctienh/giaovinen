const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const examController = require('../controllers/examController');
const teacherController = require('../controllers/teacherController');
const resultController = require('../controllers/resultController');
const subjectController = require('../controllers/subjectController');
const { verifyToken } = require('../config/authMiddleware');

// Yêu cầu phải có Token hợp lệ mới được truy cập các API bên dưới
router.use(verifyToken);

// Quản lý câu hỏi
router.get('/questions', questionController.getQuestions);
router.post('/questions/add', questionController.addQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);
router.get('/questions/:id', questionController.getQuestionDetail);
router.put('/questions/:id', questionController.updateQuestion);

// Quản lý đề thi
router.get('/exams', examController.getExams);
router.post('/exams/add', examController.addExam);
router.patch('/exams/:id/status', examController.updateExamStatus);
router.patch('/exams/:id/time', examController.updateExamTime);
router.put('/exams/:id', examController.updateExam);
router.get('/exams/:id/questions', examController.getExamQuestions);
router.get('/exams/:id/full', examController.getExamFullDetails);
router.delete('/exams/:id', examController.deleteExam);

// Hồ sơ giáo viên
router.get('/:id/stats', teacherController.getStats);
router.put('/:id/profile', teacherController.updateProfile);
router.put('/:id/password', teacherController.changePassword);

// Kết quả thi
router.get('/results/summary', resultController.getResultsSummary);
router.get('/results/:id', resultController.getResultDetails);
router.get('/paper/:ketqua_id', resultController.getPaperDetails);

// Môn học
router.get('/subjects', subjectController.getSubjects);

module.exports = router;