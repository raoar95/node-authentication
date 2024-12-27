import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { throwApiError } from "../utils/ApiErrorHandler.js";
import { UserModel } from "../models/user.model.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";

// ***************************************** Register Controller Start *************************************************

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Check Blank Field
  if (
    !fullName ||
    !email ||
    !password ||
    [fullName, email, password].some((value) => value.trim() === "")
  ) {
    return throwApiError(res, 400, "All Fields are Required");
  }

  // Check if Email Already Exist
  const existedEmail = await UserModel.findOne({ email });

  if (existedEmail) {
    return throwApiError(res, 409, "Email Already Exist");
  }

  const user = await UserModel.create({
    fullName,
    email,
    password,
  });

  // Create User
  const userCreated = await UserModel.findById(user._id).select(
    "-password -refreshToken" //? Hide `password` and `refreshToken` in Response
  );

  if (!userCreated) {
    return throwApiError(
      res,
      500,
      "Something Went Wrong While Registering User"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "User Registered Successfully"));
});

// ***************************************** Register Controller End *************************************************

// ***************************************** Login Controller Start **************************************************

const generateToken = async (userId, res) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // `Decode Refresh Token` for `Expiry Checking`
    // const decodedRefreshToken = jwt.decode(refreshToken); // Decoding the refresh token
    // const refreshTokenExpiry = decodedRefreshToken?.exp; // Extract expiration timestamp
    // const refreshTokenExpiryDate = new Date(refreshTokenExpiry * 1000); // Convert to JavaScript Date object

    // Don't Run Code on `Save`
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Creating `User Object Data` without `Password` and `Refresh Token`
    const logUser = user.toObject(); // Convert to plain object
    console.log("logUser", logUser);

    delete logUser.password; // Remove password field
    delete logUser.refreshToken; // Remove refreshToken field

    return { logUser, accessToken, refreshToken };
  } catch (error) {
    return throwApiError(res, 500, "Error Generating Tokens");
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

const loginUser = asyncHandler(async (req, res) => {
  // Get User Details
  const { email, password } = req.body;

  if (!email || !password || password.trim() === "" || email.trim() === "") {
    return throwApiError(res, 400, "All Fields are Required");
  }

  // Check if Email Not Found
  const existedUser = await UserModel.findOne({ email });

  if (!existedUser) {
    return throwApiError(res, 409, "Email or Username Not Found");
  }

  // Check if Password Correct
  const passwordCorrect = await existedUser.isPasswordCorrect(password);

  if (!passwordCorrect) return throwApiError(res, 409, "Wrong Password");

  const { logUser, accessToken, refreshToken } = await generateToken(
    existedUser._id,
    res
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, options) // Sending `accessTokens` Cookies
    .cookie("refreshToken", refreshToken, options) // Sending `refreshToken` Cookies
    .json(
      new ApiResponse(200, "User Logged In Successfully", {
        user: logUser,
        accessToken,
        refreshToken,
      })
    );
});

// ***************************************** Login Controller End **************************************************

// ***************************************** Logout Controller Start ***********************************************

const logoutUser = asyncHandler(async (req, res) => {
  await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options) // Removing `accessTokens` Cookies
    .clearCookie("refreshToken", options) // Removing `refreshToken` Cookies
    .json(new ApiResponse(200, "User Logged Out Successfully"));
});

// ***************************************** Logout Controller End ****************************************

// **************************************** Renew Refresh Token Start ****************************************

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return throwApiError(res, 401, "Unauthorized Request");
  }

  const user = await verifyUserToken(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    res,
    true
  );

  if (incomingRefreshToken !== user?.refreshToken) {
    return throwApiError(res, 401, "Refresh token is expired or used");
  }

  const { _, accessToken, newRefreshToken } = await generateToken(
    user._id,
    res
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, options) // Storing `accessTokens` Cookies
    .cookie("refreshToken", newRefreshToken, options) // Storing `refreshToken` Cookies
    .json(
      new ApiResponse(200, "Access Token Refreshed", {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
});

// **************************************** Renew Refresh Token End ****************************************

export { registerUser, loginUser, logoutUser, refreshAccessToken };
