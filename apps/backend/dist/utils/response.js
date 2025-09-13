// Response helper utilities
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../constants/index.js";
export const sendSuccess = (res, data, message, statusCode = HTTP_STATUS.OK) => {
    return res.status(statusCode).json({
        data,
        message: message || SUCCESS_MESSAGES.RESUME_UPLOADED,
    });
};
export const sendError = (res, error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
    return res.status(statusCode).json({
        error,
    });
};
export const sendCreated = (res, data, message) => {
    return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};
export const sendBadRequest = (res, error) => {
    return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
};
export const sendUnauthorized = (res, error) => {
    return sendError(res, error, HTTP_STATUS.UNAUTHORIZED);
};
export const sendForbidden = (res, error) => {
    return sendError(res, error, HTTP_STATUS.FORBIDDEN);
};
export const sendNotFound = (res, error) => {
    return sendError(res, error, HTTP_STATUS.NOT_FOUND);
};
export const sendInternalError = (res, error) => {
    return sendError(res, error, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
