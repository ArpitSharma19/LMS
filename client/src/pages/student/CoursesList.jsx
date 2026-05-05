import React, { useEffect, useState } from 'react'
import Footer from '../../components/student/Footer'
import { assets } from '../../assets/assets'
import CourseCard from '../../components/CourseCard';
import { useStore } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import SearchBar from '../../components/student/SearchBar';

const CoursesList = () => {
    const navigate = useNavigate();
    const { input } = useParams()
    const { courses } = useStore()
    const [filteredCourse, setFilteredCourse] = useState([])

    useEffect(() => {
        if (courses && courses.length > 0) {
            setFilteredCourse(
                input 
                    ? courses.filter(item => item.courseTitle.toLowerCase().includes(input.toLowerCase()))
                    : courses
            )
        }
    }, [courses, input])

    return (
        <>
            <div className="relative md:px-36 px-8 pt-20 text-left min-h-[70vh]">
                <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
                    <div>
                        <h1 className='text-4xl font-semibold text-gray-800'>Course List</h1>
                        <p className='text-gray-500'><span onClick={() => navigate('/')} className='text-blue-600 cursor-pointer'>Home</span> / <span>Course List</span></p>
                    </div>
                    <SearchBar data={input} />
                </div>
                {input && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 -mb-8 text-gray-600 bg-gray-50 rounded-lg'>
                    <p>Results for: <span className='font-bold text-gray-800'>{input}</span></p>
                    <img onClick={() => navigate('/course-list')} className='cursor-pointer w-3' src={assets.cross_icon} alt="clear" />
                </div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-6 px-2 md:p-0">
                    {filteredCourse.map((course) => <CourseCard key={course.id} course={course} />)}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default CoursesList 