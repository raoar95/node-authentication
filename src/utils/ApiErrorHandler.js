class ApiError {
  constructor(status, errorMessage = "Something Went Wrong", stack = "") {
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    this.success = false;
    this.statusCode = status;
    this.errorMessage = errorMessage;
  }
}

// Send JSON Error Response
const throwApiError = (res, status, message) => {
  const errorResponse = new ApiError(status, message);
  return res.status(status).json(errorResponse);
};

export { ApiError, throwApiError };
