import React, { useState, useEffect, useContext } from 'react'
import api from '../../services/api'
import { useStore } from '../../context/AuthContext'
import { Search, Trash2, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'

const UserManagement = () => {
  const {} = useStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/admin/users', {
        params: { search, role: roleFilter === 'all' ? undefined : roleFilter }
      })
      if (data.success) {
        setUsers(data.users)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (userId, status) => {
    try {
      const { data } = await api.post('/api/admin/update-user-status', 
        { userId, status }
      )
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleVerification = async (userId, isVerified) => {
    try {
      const { data } = await api.post('/api/admin/update-user-status', 
        { userId, isVerified }
      )
      if (data.success) {
        toast.success('Verification status updated')
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      const { data } = await api.delete(`/api/admin/user/${userId}`)
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500">View and manage all registered users.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="educator">Educators</option>
        </select>
        <button onClick={fetchUsers} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Search
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">User</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Verification</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={user.imageUrl} className="w-10 h-10 rounded-full mr-3" alt={user.name} />
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.educatorProfile ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.educatorProfile ? 'Educator' : 'Student'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center text-sm font-medium ${user.status === 'blocked' ? 'text-red-600' : 'text-green-600'}`}>
                      {user.status === 'blocked' ? <ShieldAlert size={16} className="mr-1" /> : <ShieldCheck size={16} className="mr-1" />}
                      {user.status === 'active' ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.educatorProfile ? (
                      <button 
                        onClick={() => handleVerification(user.id, !user.isVerified)}
                        className={`flex items-center text-sm font-medium ${user.isVerified ? 'text-green-600' : 'text-orange-600'}`}
                      >
                        {user.isVerified ? <CheckCircle size={16} className="mr-1" /> : <XCircle size={16} className="mr-1" />}
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(user.id, user.status === 'active' ? 'blocked' : 'active')}
                        className={`p-2 rounded-lg hover:bg-gray-100 ${user.status === 'active' ? 'text-red-500' : 'text-green-500'}`}
                        title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                      >
                        {user.status === 'active' ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete User"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagement
