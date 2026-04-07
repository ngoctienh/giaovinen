import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherLogin = lazy(() => import('./pages/TeacherLogin'));
const TeacherLayout = lazy(() => import('./pages/TeacherLayout'));
const TeacherProfile = lazy(() => import('./pages/TeacherProfile'));
const TeacherQuestions = lazy(() => import('./pages/TeacherQuestions'));
const TeacherManageExams = lazy(() => import('./pages/TeacherManageExams'));
const TeacherAddExam = lazy(() => import('./pages/TeacherAddExam'));
const TeacherOrganizeExams = lazy(() => import('./pages/TeacherOrganizeExams'));
const TeacherResults = lazy(() => import('./pages/TeacherResults'));
const TeacherResultDetail = lazy(() => import('./pages/TeacherResultDetail'));
const TeacherViewPaper = lazy(() => import('./pages/TeacherViewPaper'));

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('teacherToken');
    if (!token) {
        return <Navigate to="/teacher/login" replace />;
    }
    return children;
};
function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<div className="page-loading">Đang tải...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/teacher/login" />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />

          <Route path="/teacher" element={
              <ProtectedRoute>
                  <TeacherLayout />
              </ProtectedRoute>
          }>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="questions" element={<TeacherQuestions />} />
              <Route path="manage-exams" element={<TeacherManageExams />} />
              <Route path="add-exam" element={<TeacherAddExam />} />
              <Route path="organize-exams" element={<TeacherOrganizeExams />} />
              <Route path="profile" element={<TeacherProfile />} />
              <Route path="results" element={<TeacherResults />} />
              <Route path="results/:id" element={<TeacherResultDetail />} /> 
              <Route path="view-paper/:id" element={<TeacherViewPaper />} /> 
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;