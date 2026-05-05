import express from "express";
import {
    getAllCourses,
    getCourseId,
    getCourseCategories
} from "../controllers/courseController.js";

const courseRouter = express.Router();

courseRouter.get("/all", getAllCourses);
courseRouter.get("/categories", getCourseCategories);
courseRouter.get("/:id", getCourseId);

export default courseRouter;
