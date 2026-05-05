import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((issue) => `${issue.path.join('.')} : ${issue.message}`)
      .join(', ');
    return next(new ApiError(400, errorMessage));
  }

  // Update request with parsed/transformed data
  Object.assign(req, result.data);
  return next();
};

export default validate;
