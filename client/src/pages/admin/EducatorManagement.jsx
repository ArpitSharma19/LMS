import React, { useEffect, useState, useContext } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'
import { useStore } from '../../context/AuthContext'

const STATUS_TABS = ['pending', 'active', 'rejected']

const EducatorManagement = () => {
  const {} = useStore()

  const [educators, setEducators] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState({ open: false, educatorId: null, reason: '' })

  
  const fetchEducators = async (status = activeTab) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/admin/educators?status=${status}`)
      if (data.success) setEducators(data.educators)
      else toast.error(data.message)
    } catch {
      toast.error('Failed to fetch educators')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEducators(activeTab) }, [activeTab])

  const handleApprove = async (educatorId) => {
    try {
      const { data } = await api.post('/api/admin/educators/approve', { educatorId })
      if (data.success) {
        toast.success(data.message)
        fetchEducators(activeTab)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Approval failed')
    }
  }

  const handleReject = async () => {
    const { educatorId, reason } = rejectModal
    try {
      const { data } = await api.post('/api/admin/educators/reject', { educatorId, reason })
      if (data.success) {
        toast.success(data.message)
        setRejectModal({ open: false, educatorId: null, reason: '' })
        fetchEducators(activeTab)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Rejection failed')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Educator Management</h1>
        <p className="text-gray-500 mt-1">Review and approve educator applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-medium text-sm capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : educators.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No {activeTab} educators found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {educators.map(educator => (
            <div key={educator.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                    {educator.User?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{educator.User?.name}</p>
                    <p className="text-sm text-gray-500">{educator.User?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Applied {new Date(educator.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {activeTab === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(educator.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, educatorId: educator.id, reason: '' })}
                      className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {activeTab === 'active' && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Approved
                  </span>
                )}

                {activeTab === 'rejected' && (
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                    ❌ Rejected
                  </span>
                )}
              </div>

              {/* Profile Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                {educator.qualification && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Qualification</p>
                    <p className="text-sm text-gray-700 mt-0.5">{educator.qualification}</p>
                  </div>
                )}
                {educator.experience != null && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Experience</p>
                    <p className="text-sm text-gray-700 mt-0.5">{educator.experience} years</p>
                  </div>
                )}
                {educator.subjects?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Subjects</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {educator.subjects.map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {educator.bio && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Bio</p>
                    <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{educator.bio}</p>
                  </div>
                )}
                {educator.portfolioLinks && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Portfolio</p>
                    <p className="text-sm text-blue-600 mt-0.5 truncate">{educator.portfolioLinks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Educator Application</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                rows={3}
                placeholder="Provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ open: false, educatorId: null, reason: '' })}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EducatorManagement
