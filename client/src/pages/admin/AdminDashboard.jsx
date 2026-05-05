import React, { useState, useEffect, useContext } from 'react'
import api from '../../services/api'
import { useStore } from '../../context/AuthContext'
import { Users, GraduationCap, BookOpen, ShoppingBag, IndianRupee, Activity } from 'lucide-react'
import { toast } from 'react-toastify'

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
    <div className={`p-4 rounded-lg ${color} mr-4 text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
)

const AdminDashboard = () => {
  const { currency } = useStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/admin/stats')
      if (data.success) {
        setStats(data.stats)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div className="text-center py-20">Loading dashboard stats...</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome to the LMS administrative overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-600" />
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={GraduationCap} color="bg-green-600" />
        <StatCard title="Total Educators" value={stats?.totalEducators || 0} icon={Users} color="bg-purple-600" />
        <StatCard title="Daily Active" value={stats?.dailyActive || 0} icon={Activity} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon={BookOpen} color="bg-indigo-600" />
        <StatCard title="Total Purchases" value={stats?.totalPurchases || 0} icon={ShoppingBag} color="bg-pink-600" />
        <StatCard title="Total Revenue" value={`${currency}${stats?.totalRevenue || 0}`} icon={IndianRupee} color="bg-emerald-600" />
      </div>

      {/* Analytics Chart Placeholder */}
      <div className="mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6">User Activity (Last 30 Days)</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Interactive Activity Chart will render here</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
