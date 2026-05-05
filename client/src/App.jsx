import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Provider
import StoreProvider from './context/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/student/Home';
import StudentDashboard from './pages/student/Dashboard';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import Player from './pages/student/Player';
import Profile from './pages/Profile';
import EducatorDashboard from './pages/educator/Dashboard';
import MyCourses from './pages/educator/MyCourses';
import AddCourse from './pages/educator/AddCourse';
import EditCourse from './pages/educator/EditCourse';
import EducatorProfile from './pages/EducatorProfile';
import AdminDashboard from './pages/admin/Dashboard';
import EducatorApprovals from './pages/admin/EducatorApprovals';
import CommissionSettings from './pages/admin/CommissionSettings';

function App() {
  return (
    <StoreProvider>
      <div className="min-h-screen bg-surface selection:bg-primary/20 selection:text-primary">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/educator/:id" element={<EducatorProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-enrollments" element={<ProtectedRoute><MyEnrollments /></ProtectedRoute>} />
          <Route path="/player/:id/:lectureId?" element={<ProtectedRoute><Player /></ProtectedRoute>} />
          <Route path="/learn/:id/lesson/:lectureId?" element={<ProtectedRoute><Player /></ProtectedRoute>} />

          {/* Educator Routes */}
          <Route path="/educator/dashboard" element={<ProtectedRoute role="educator"><EducatorDashboard /></ProtectedRoute>} />
          <Route path="/educator/my-courses" element={<ProtectedRoute role="educator"><MyCourses /></ProtectedRoute>} />
          <Route path="/educator/add-course" element={<ProtectedRoute role="educator"><AddCourse /></ProtectedRoute>} />
          <Route path="/educator/edit-course/:id" element={<ProtectedRoute role="educator"><EditCourse /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><EducatorApprovals /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="admin"><CommissionSettings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Chatbot />
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </div>
    </StoreProvider>
  );
}

export default App;
