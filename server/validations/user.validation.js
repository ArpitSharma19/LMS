import { z } from 'zod';

export const purchaseCourseSchema = z.object({
  body: z.object({
    courseId: z.union([z.string(), z.number()]),
  }),
});

export const addUserRatingSchema = z.object({
  body: z.object({
    courseId: z.union([z.string(), z.number()]),
    rating: z.number({
      required_error: "Rating is required",
    }).min(1).max(5),
  }),
});
