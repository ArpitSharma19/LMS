import { getMulter } from '../utils/loaders.js';

const upload = {
    single: (fieldName) => {
        return async (req, res, next) => {
            try {
                const multerInstance = await getMulter();
                return multerInstance.single(fieldName)(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    },
    fields: (fieldsArray) => {
        return async (req, res, next) => {
            try {
                const multerInstance = await getMulter();
                return multerInstance.fields(fieldsArray)(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
};

export default upload;
