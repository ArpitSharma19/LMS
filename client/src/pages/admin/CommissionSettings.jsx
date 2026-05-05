import React, { useState, useEffect, useContext } from 'react'
import api from '../../services/api'
import { useStore } from '../../context/AuthContext'
import { Save, Percent, IndianRupee, Wallet } from 'lucide-react'
import { toast } from 'react-toastify'
import AdminLayout from '../../layouts/AdminLayout'

const CommissionSettings = () => {
  const { currency } = useStore()
  const [percentage, setPercentage] = useState(20)
  const [certFee, setCertFee] = useState(50)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/commission')
      if (data.success) {
        setPercentage(data.settings.platformPercentage)
        setCertFee(data.settings.certificateFee)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/api/admin/update-commission', 
        { percentage, certificateFee: certFee }
      )
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) return <AdminLayout title="Platform Commission"><div className="text-center py-20">Loading settings...</div></AdminLayout>

  return (
    <AdminLayout 
      title="Commission Settings" 
      subtitle="Manage platform commission and educator earnings split."
    >
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant">
            <h2 className="text-xl font-bold mb-6 flex items-center text-on-surface">
              <Percent className="mr-2 text-primary" size={24} />
              Configure Percentage
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-label-caps text-on-surface-variant mb-2">Platform Commission (%)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface outline-none focus:ring-2 focus:ring-primary text-lg font-bold text-on-surface"
                    required
                  />
                  <span className="ml-3 text-2xl font-bold text-outline">%</span>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">This percentage will be deducted from every course purchase automatically.</p>
              </div>

              <div>
                <label className="block text-label-caps text-on-surface-variant mb-2">Certificate Fee ({currency})</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={certFee}
                    onChange={(e) => setCertFee(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface outline-none focus:ring-2 focus:ring-primary text-lg font-bold text-on-surface"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">Fixed amount charged for certificate requests. 100% goes to platform.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-md"
              >
                <Save className="mr-2" size={20} />
                {saving ? 'Saving...' : 'Update Commission Settings'}
              </button>
            </form>
          </div>

          <div className="bg-primary text-on-primary p-8 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Wallet className="mr-2 text-primary-container" size={24} />
                Live Example
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/20 pb-2">
                  <span>Course Price</span>
                  <span className="font-bold">{currency}1,000.00</span>
                </div>
                <div className="flex justify-between border-b border-white/20 pb-2">
                  <span>Platform Fee ({percentage}%)</span>
                  <span className="font-bold text-primary-container">-{currency}{(1000 * percentage / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-primary-container">Educator Earning</span>
                  <span className="text-2xl font-extrabold text-white">{currency}{(1000 - (1000 * percentage / 100)).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-8 bg-white/10 p-4 rounded-lg">
                <p className="text-sm italic">"The system calculates these splits in real-time during the checkout process using our secure Stripe integration."</p>
              </div>
            </div>
            {/* Abstract Background Circle */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default CommissionSettings;
