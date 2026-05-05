import { supabase } from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllCourses = catchAsync(async (req, res) => {
    const { sort, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
        .from('courses')
        .select(`
            *,
            educatorDetails:users (id, name, image_url)
        `, { count: 'exact' })
        .eq('is_published', true);

    // Handling sort
    if (sort === 'price_low') query = query.order('course_price', { ascending: true });
    else if (sort === 'price_high') query = query.order('course_price', { ascending: false });
    else if (sort === 'popular') query = query.order('rating_count', { ascending: false }); // Fallback to rating_count if purchaseCount is hard to join
    else query = query.order('created_at', { ascending: false });

    const { data: courses, count, error } = await query
        .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ 
        success: true, 
        courses, 
        totalCourses: count, 
        page: parseInt(page), 
        totalPages: Math.ceil(count / parseInt(limit)) 
    });
});

export const getCourseCategories = catchAsync(async (req, res) => {
    const { data: courses, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_published', true);
    
    if (error) throw error;

    const categories = [...new Set(courses.map(c => c.category))].filter(Boolean);
    res.json({ success: true, categories });
});

export const getCourseId = catchAsync(async (req, res) => {
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            educatorDetails:users (id, name, image_url),
            courseContent:chapters (
                *,
                chapterContent:lectures (*)
            ),
            courseRatings:ratings (user_id, rating)
        `)
        .eq('id', req.params.id)
        .single();

    if (error || !course) throw new ApiError(404, "Course not found");
    res.json({ success: true, courseData: course });
});