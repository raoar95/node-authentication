//? Higher Order Arrow Function ( Pass Another Function As an Argument ) ( FOR PROMISE HANDLING )
const asyncHandler = (requestHandler) => {
  return (request, response, next) => {
    Promise.resolve(requestHandler(request, response, next)).catch((err) =>
      next(err)
    );
  };
};

//? Higher Order Arrow Function ( Pass Another Function As an Argument ) ( FOR TRY CATCH HANDLING )
// const tryCatchHandler = (fn) => async (request, response, next) => {
//   try {
//     await fn(request, response, next);
//   } catch (error) {
//     response.status(err.code || 500).json({
//       success: false,
//       message: err.message || "Server Error",
//     });
//   }
// };

export { asyncHandler };
