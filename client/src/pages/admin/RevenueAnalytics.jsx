import React, { useState, useEffect, useContext } from 'react'
import api from '../../services/api'
import { useStore } from '../../context/AuthContext'
import { TrendingUp, Wallet, Landmark, Calendar, Download } from 'lucide-react'
import { toast } from 'react-toastify'

const RevenueAnalytics = () => {
  const { currency } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRevenue = async () => {
    try {
      const { data } = await api.get('/api/admin/revenue')
      if (data.success) {
        setData(data)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenue()
  }, [])

  if (loading) return <div className="text-center py-20">Loading analytics...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revenue Analytics</h1>
          <p className="text-gray-500">Detailed breakdown of platform and educator earnings.</p>
        </div>
        <button className="flex items-center bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
          <Download className="mr-2" size={18} />
          Export Report (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Landmark size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Gross Revenue</p>
          <h3 className="text-3xl font-black text-gray-800 mt-1">{currency}{data?.revenue?.totalRevenue || 0}</h3>
          <p className="text-xs text-green-500 font-bold mt-2 flex items-center">
            <TrendingUp size={12} className="mr-1" /> +12.5% from last month
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Admin Earnings</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">{currency}{data?.revenue?.totalCommission || 0}</h3>
          <p className="text-xs text-gray-400 mt-2">Platform commission share</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <GraduationCap size={24} />
          </div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Educator Payouts</p>
          <h3 className="text-3xl font-black text-orange-600 mt-1">{currency}{data?.revenue?.totalEducatorEarnings || 0}</h3>
          <p className="text-xs text-gray-400 mt-2">Paid out to course creators</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Monthly Performance</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">2026</button>
            <button className="px-3 py-1 hover:bg-gray-50 text-gray-400 text-xs font-bold rounded">2025</button>
          </div>
        </div>
        
        <div className="h-80 flex items-end justify-between gap-4 px-4 pt-10">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
            <div key={month} className="flex-1 flex flex-col items-center group">
              <div 
                className="w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-600 relative" 
                style={{ height: `${Math.floor(Math.random() * 80) + 10}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {currency}{(Math.random() * 5000 + 1000).toFixed(0)}
                </div>
              </div>
              <span className="text-xs text-gray-400 font-bold mt-4">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const GraduationCap = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
)

export default RevenueAnalytics
