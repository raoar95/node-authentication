import { throwApiError } from "../utils//ApiErrorHandler.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { UserModel } from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Verify User Function
export const verifyUserToken = async (
  token,
  tokenSecret,
  res,
  includeRefreshToken = false
) => {
  // console.log("token...: ", token);
  // console.log("tokenSecret...: ", tokenSecret);

  try {
    // console.log("token...: ", token);
    // console.log("tokenSecret...: ", tokenSecret);
    const userToken = jwt.verify(token, tokenSecret);
    console.log("userToken......", userToken);

    const fieldsToExclude = includeRefreshToken
      ? "-password"
      : "-password -refreshToken";

    const user = await UserModel.findById(userToken?._id).select(
      fieldsToExclude
    );

    if (!user) {
      return throwApiError(res, 401, "Invalid Access Token");
    }

    return user;
  } catch (error) {
    // next(error);`
    return throwApiError(res, 401, error?.message || "Invalid Refresh Token");
  }
};

// User Token Authentication Function
export const userTokenAuth = asyncHandler(async (req, res, next) => {
  // console.log("Token received on backend:", req.header("Authorization"));

  console.log("Request Headers:", req.headers);

  try {
    const userToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("userToken: ", userToken);
    console.log("userTokenSecret: ", process.env.ACCESS_TOKEN_SECRET);

    if (!userToken || typeof userToken !== "string") {
      return throwApiError(res, 401, "Unauthorized Request");
    }

    const user = await verifyUserToken(
      userToken,
      process.env.ACCESS_TOKEN_SECRET,
      res
    );

    req.user = user;
    next();
  } catch (error) {
    return throwApiError(res, 401, error?.message || "Invalid Access Token");
    // next(error);
  }
});
