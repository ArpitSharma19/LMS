import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";
import { dummyCourses } from "../assets/assets"; // ✅ import dummy courses

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY || "₹";

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [showLogin, setShowLogin] = useState(false);
  const [isEducator, setIsEducator] = useState(false);
  const [allCourses, setAllCourses] = useState([]); // ✅ main course state
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  //Fetch All Courses (with dummy fallback)
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success && data.courses.length > 0) {
        setAllCourses(data.courses);
      } else {
        console.warn("⚠️ Using dummy courses - backend returned empty list");
        setAllCourses(dummyCourses);
      }
    } catch (error) {
      console.warn("⚠️ Backend not reachable, using dummy courses");
      setAllCourses(dummyCourses);
    }
  };

  // ✅ Fetch User Data
  const fetchUserData = async () => {
    try {
      if (user?.publicMetadata?.role === "educator") setIsEducator(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setUserData(data.user);
      else toast.error(data.message);
    } catch (error) {
      console.warn("⚠️ Failed to fetch user data:", error.message);
    }
  };

  // ✅ Fetch Enrolled Courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setEnrolledCourses(data.enrolledCourses.reverse());
    } catch (error) {
      console.warn("⚠️ Failed to fetch enrolled courses:", error.message);
    }
  };

  // ✅ Helpers
  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.forEach((chapter) =>
      chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration))
    );
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateRating = (course) => {
    if (!course.courseRatings || course.courseRatings.length === 0) return 0;
    const total = course.courseRatings.reduce((sum, r) => sum + r.rating, 0);
    return Math.floor(total / course.courseRatings.length);
  };

  const calculateNoOfLectures = (course) => {
    let total = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) total += chapter.chapterContent.length;
    });
    return total;
  };

  // ✅ Load data on mount
  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  const value = {
    showLogin,
    setShowLogin,
    backendUrl,
    currency,
    navigate,
    userData,
    setUserData,
    getToken,
    allCourses,
    setAllCourses,
    fetchAllCourses,
    enrolledCourses,
    fetchUserEnrolledCourses,
    calculateChapterTime,
    calculateCourseDuration,
    calculateRating,
    calculateNoOfLectures,
    isEducator,
    setIsEducator,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
