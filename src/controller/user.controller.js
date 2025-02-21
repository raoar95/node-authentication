/* Model */
import { UserModel } from "../models/user.model.js";

/* Utils */
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { throwApiError } from "../utils/ApiErrorHandler.js";
import { sendEmail, generateEmailTemplate } from "../utils/EmailHandler.js";
import { generateOtp } from "../utils/RandomFunctions.js";

/* Constant */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

//============================================= Global Functions ================================================

// Generate Tokens
const generateToken = async (userId, res) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // `Decode Refresh Token` for `Expiry Checking`
    // const decodedRefreshToken = jwt.decode(refreshToken);                 // Decoding the refresh token
    // const refreshTokenExpiry = decodedRefreshToken?.exp;                  // Extract expiration timestamp
    // const refreshTokenExpiryDate = new Date(refreshTokenExpiry * 1000);   // Convert to JavaScript Date object

    // Don't Run Code on `Save`
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const logUser = user.toObject();

    delete logUser.password;
    delete logUser.refreshToken;
    delete logUser.otpAuth;

    return { logUser, accessToken, refreshToken };
  } catch (error) {
    return throwApiError(res, 500, "Error Generating Tokens");
  }
};

// Check if User Exist
const checkExistedUser = async (res, base, errMsg) => {
  const existedUser = await UserModel.findOne(base);

  if (!existedUser) {
    return throwApiError(res, 409, errMsg);
  }

  return existedUser;
};

// Get User Data
const getUserData = async (userId) => {
  const userData = await UserModel.findById(userId).select(
    "-password -refreshToken -otpAuth"
  );

  if (!userData) {
    return throwApiError(res, 500, "Error Fetching User Data");
  }

  return userData;
};

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

const loginUser = asyncHandler(async (req, res) => {
  if (
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "")
  ) {
    return res.status(200).json(new ApiResponse(200, "User already Logged in"));
  }

  // Get User Details
  const { email, password } = req.body;

  if (!email || !password || password.trim() === "" || email.trim() === "") {
    return throwApiError(res, 400, "All Fields are Required");
  }

  const existedUser = await checkExistedUser(
    res,
    { email },
    "Email or Username Not Found"
  );

  // Check if Password Correct
  const passwordCorrect = await existedUser.isPasswordCorrect(password);

  if (!passwordCorrect) throwApiError(res, 409, "Wrong Password");

  const { logUser, accessToken, refreshToken } = await generateToken(
    existedUser._id,
    res
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions) // Sending `accessTokens` Cookies
    .cookie("refreshToken", refreshToken, cookieOptions) // Sending `refreshToken` Cookies
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
    .clearCookie("accessToken", cookieOptions) // Removing `accessTokens` Cookies
    .clearCookie("refreshToken", cookieOptions) // Removing `refreshToken` Cookies
    .json(new ApiResponse(200, "User Logged Out Successfully"));
});

// ***************************************** Logout Controller End ****************************************

// ********************************************* Verify Otp Start ******************************************

const verifyOtp = asyncHandler(async (req, res) => {
  const existedUser = await checkExistedUser(
    res,
    { email: req.user.email },
    "Email Not Found"
  );

  if (existedUser.otpAuth.otp === "") {
    return throwApiError(res, 409, "Unauthorized Request");
  }

  const isOtpExpired =
    existedUser.otpAuth.otp !== "" &&
    new Date(existedUser.otpAuth.expireTime).getTime() < new Date().getTime();

  if (isOtpExpired) {
    return throwApiError(res, 409, "Otp Expired");
  }

  const isOtpCorrect = req.body.otp === existedUser.otpAuth.otp;

  if (!isOtpCorrect) {
    return throwApiError(res, 409, "Invalid Otp");
  }

  const userData = await getUserData(existedUser._id);

  existedUser.otpAuth.otp = "";
  existedUser.otpAuth.sendTime = 0;
  existedUser.otpAuth.newRequestTime = 0;
  existedUser.otpAuth.expireTime = 0;

  await existedUser.save();

  const getResponse = () => {
    if (req.url === "/verify-email-otp-login") {
      return new ApiResponse(200, "Otp Verified Successfully", userData);
    }

    return new ApiResponse(200, "Otp Verified Successfully");
  };

  return res.status(200).json(getResponse());
});

// ********************************************* Verify Otp End ********************************************

// ******************************************* Reset Password Start ****************************************

//================================================ Request Reset Password =====================================

const requestResetPassword = asyncHandler(async (req, res) => {
  const existedUser = await checkExistedUser(
    res,
    { email: req.body.email },
    "Email Not Registered"
  );

  // Generate Token
  const { _, accessToken } = await generateToken(existedUser._id, res);

  //? Reset With Link
  //  const randomText = generateRandomText(90);

  // const resetURL =
  //   process.env.NODE_ENV === "development"
  //     ? `${LOCAL_SERVER}/reset-password/${randomText}`
  //     : `${PRO_SERVER}/reset-password/${randomText}`;

  //? Reset With OTP
  const isNewRequestTime =
    existedUser.otpAuth.otp !== "" &&
    new Date(existedUser.otpAuth.newRequestTime).getTime() >
      new Date().getTime();

  if (isNewRequestTime) {
    return throwApiError(
      res,
      409,
      `Please Wait Until ${new Date(
        existedUser.otpAuth.newRequestTime
      ).toLocaleTimeString()} for New Request`
    );
  }

  const isRequestPassword = req.url === "/request-reset-password";
  const verificationCode = generateOtp();

  existedUser.otpAuth.otp = verificationCode;
  existedUser.otpAuth.sendTime = new Date().getTime();
  existedUser.otpAuth.newRequestTime = existedUser.otpAuth.sendTime + 60000;
  existedUser.otpAuth.expireTime = existedUser.otpAuth.sendTime + 600000;
  existedUser.otpAuth.token = accessToken;

  await existedUser.save();

  const message = isRequestPassword
    ? generateEmailTemplate(verificationCode)
    : generateEmailTemplate(verificationCode, "OtpLogin");

  // Send Email
  await sendEmail(
    existedUser.email,
    `${
      isRequestPassword ? "Reset TaskBuddy Password" : "TaskBuddy Account Login"
    }`,
    message
  ).catch(() => throwApiError(res, 500, "Error During Sending Email"));

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        `${isRequestPassword ? "Reset" : "Login"} Email Sended Successfully`,
        { accessToken }
      )
    );
});

//================================ Reset Password =====================================

const resetPassword = asyncHandler(async (req, res) => {
  try {
    const existedUser = await checkExistedUser(
      res,
      { email: req.user.email },
      "User not found"
    );

    if (existedUser.otpAuth.otp !== "") {
      return throwApiError(res, 409, "Unauthorized Request");
    }

    existedUser.password = req.body.password;
    existedUser.otpAuth.token = "";

    await existedUser.save();

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .json(new ApiResponse(200, "Password Reset Successfully"));
  } catch (error) {
    return res
      .status(400)
      .json(new ApiResponse(200, "Error Resetting Password Please Try Again"));
  }
});

// ******************************************* Reset Password End ******************************************

// ************************************************ isAuth Start ********************************************

const isAuth = asyncHandler(async (req, res) => {
  const userData = await getUserData(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, "User Authenticated Successfully", userData));
});

// ************************************************ isAuth end ********************************************

// **************************************** Renew Refresh Token Start ****************************************

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { _, accessToken, refreshToken } = await generateToken(
    req.user._id,
    res
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Access Token Refreshed", {
        accessToken,
        refreshToken,
      })
    );
});

// **************************************** Renew Refresh Token End ****************************************

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyOtp,
  requestResetPassword,
  resetPassword,
  isAuth,
  refreshAccessToken,
};
