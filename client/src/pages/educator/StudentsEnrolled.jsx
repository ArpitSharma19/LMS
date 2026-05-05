import React, { useContext, useEffect, useState } from 'react';
import api from '../../services/api';
import { useStore } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const StudentsEnrolled = () => {

  const { isEducator } = useStore()

  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEnrolledStudents = async () => {
    try {
      const { data } = await api.get('/api/educator/enrolled-students')
      if (data.success) {
        setEnrolledStudents(Array.isArray(data.enrolledStudents) ? [...data.enrolledStudents].reverse() : [])
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents()
    } else {
      setLoading(false)
    }
  }, [isEducator])

  if (loading) return <div className="p-8"><p>Loading enrolled students...</p></div>

  return (
    <div className="min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className='w-full'>
        <h2 className="pb-4 text-lg font-medium">Students Enrolled</h2>
        {!enrolledStudents || enrolledStudents.length === 0 ? (
          <div className='p-10 bg-gray-50 text-center rounded-xl border border-dashed border-gray-300'>
            <p className='text-gray-500'>No students have enrolled in your courses yet.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 ">
            <table className="table-fixed md:table-auto w-full overflow-hidden pb-4">
              <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Course Title</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {enrolledStudents.map((item, index) => (
                  <tr key={index} className="border-b border-gray-500/20">
                    <td className="px-4 py-3 text-center hidden sm:table-cell">{index + 1}</td>
                    <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                      <img
                        src={item.student?.imageUrl}
                        alt=""
                        className="w-9 h-9 rounded-full"
                      />
                      <span className="truncate">{item.student?.name || 'Unknown Student'}</span>
                    </td>
                    <td className="px-4 py-3 truncate">{item.courseTitle}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsEnrolled;