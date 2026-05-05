import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { LayoutDashboard, Users, Percent, TrendingUp, LogOut, GraduationCap } from 'lucide-react'

const AdminLayout = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <img src={assets.logo} alt="Logo" className="w-32 mx-auto" />
          <p className="text-center text-xs text-blue-600 font-bold mt-2 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="mt-6">
          <Link to="/admin/dashboard" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Users className="w-5 h-5 mr-3" />
            User Management
          </Link>
          <Link to="/admin/educators" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <GraduationCap className="w-5 h-5 mr-3" />
            Educators
          </Link>
          <Link to="/admin/commission" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Percent className="w-5 h-5 mr-3" />
            Commission Settings
          </Link>
          <Link to="/admin/revenue" className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <TrendingUp className="w-5 h-5 mr-3" />
            Revenue Analytics
          </Link>
          <button onClick={handleLogout} className="flex items-center w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-colors mt-10">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-10">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
