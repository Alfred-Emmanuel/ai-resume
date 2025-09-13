// Response helper utilities

import { Response } from "express";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "../constants/index.js";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): Response => {
  return res.status(statusCode).json({
    data,
    message: message || SUCCESS_MESSAGES.RESUME_UPLOADED,
  });
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): Response => {
  return res.status(statusCode).json({
    error,
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message?: string
): Response => {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

export const sendBadRequest = (res: Response, error: string): Response => {
  return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
};

export const sendUnauthorized = (res: Response, error: string): Response => {
  return sendError(res, error, HTTP_STATUS.UNAUTHORIZED);
};

export const sendForbidden = (res: Response, error: string): Response => {
  return sendError(res, error, HTTP_STATUS.FORBIDDEN);
};

export const sendNotFound = (res: Response, error: string): Response => {
  return sendError(res, error, HTTP_STATUS.NOT_FOUND);
};

export const sendInternalError = (res: Response, error: string): Response => {
  return sendError(res, error, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
