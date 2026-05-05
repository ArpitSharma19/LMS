import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminProtectedRoute = () => {
    const { isAdmin } = useStore();
    const token = localStorage.getItem('adminToken');

    if (!isAdmin && !token) {
        toast.error("Access denied. Please login as admin.");
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
