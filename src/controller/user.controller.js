import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponseHandler.js";
import { throwApiError } from "../utils/ApiErrorHandler.js";
import { UserModel } from "../models/user.model.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";

// ***************************************** Register Controller Start *************************************************

const registerUser = asyncHandler(async (req, res) => {
  // ***************************************************************************************************/
  //
  // ***************************************** */
  //? Sample Test
  // res.status(200).json({
  //   message: "User Registered successfully",
  // });
  // ***************************************** */
  //
  //
  //
  // *****************************************************/
  //? STEPS FOR USER ( REGISTER / LOGIN ) AUTHENTICATION:
  // *****************************************************/
  //
  //* 1. Get User Details
  //* 2. Validate User ( Check if User already exists  - Login Page, User Not Exit - Registration Page)
  //
  //* (IF REGISTRATION)
  //* 3. Validate User Details
  //* 4. Encrypt Important Data (Like - Password)
  //* 5. Create User Entry in Database
  //* 6. Send Success Response to User
  //
  //
  //
  // ******************/
  //? GET USER DETAILS:
  // ******************/

  //? From [ res.body ] we Get the User Details
  //* Use `Postman` to `Sent Raw Data Request` inside `Body Tab` in Postman
  // const { name, emailId, pass } = req.body;
  // console.log("Name ->", name); // Output ->  Name ->  Arun
  // console.log("Email ->", email); // Output ->  Email ->  test@mail.com
  // console.log("Password ->", password); // Output ->  Password ->  ""
  //
  //
  //
  // ****************/
  //? VALIDATE USER:
  // ***************/

  const { fullName, email, password } = req.body;

  //* Multiple Check
  // const existedUser = await User.findOne({
  //   $or: [{ username, email }],
  // });

  // if (existedUser) {
  //   return throwApiError(res, 409, "Email / Username Already Exist");
  // }

  //* Single Check
  const existedEmail = await UserModel.findOne({ email });

  let existedUsername;

  // if (username) {
  //   existedUsername = await UserModel.findOne({ username });
  // }

  if (existedEmail || existedUsername) {
    if (existedEmail) {
      return throwApiError(res, 409, "Email Already Exist");
    }

    // if (existedUsername !== null) {
    //   return throwApiError(res, 409, "Username Already Exist");
    // }
  }
  //
  //
  //
  // ***********************/
  //? VALIDATE USER DETAILS:
  // ***********************/

  //? Empty Field Check Validation
  if (
    !fullName ||
    !email ||
    !password ||
    [fullName, email, password].some((value) => value.trim() === "")
  ) {
    return throwApiError(res, 400, "All Fields are Required");
  }
  //
  //
  //
  // ******************************************/
  //? ENCRYPT IMPORTANT DATA (LIKE - PASSWORD):
  // ******************************************/

  //* ALREADY DONE IN USER MODEL

  //
  //
  //
  // *******************************/
  //? CREATE USER ENTRY IN DATABASE:
  // *******************************/

  const user = await UserModel.create({
    fullName,
    // username: username.toLowerCase(),
    email,
    password,
  });

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

  // ***************************************************************************************************/

  return res
    .status(201)
    .json(new ApiResponse(200, "User Registered Successfully"));
  //
  //
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
  //
  // *****************************************************/
  //? STEPS FOR USER ( REGISTER / LOGIN ) AUTHENTICATION:
  // *****************************************************/
  //
  //* 1. Get User Details
  //* 2. Validate User & User Details
  //
  //* (IF LOGIN)
  //* 3. Find User
  //* 4. Check Password
  //* 5. Send Access and Refresh Token through Cookies
  //* 6. Send Success Response to User
  //
  //

  //* Get User Details
  const { email, username, password } = req.body;
  //
  //
  //
  //* Empty Field Check Validation
  // if (
  //   !username ||
  //   !email ||
  //   !password ||
  //   [username, email, password].some((value) => value.trim() === "")
  // ) {
  //   return throwApiError(res, 400, "All Fields are Required");
  // }

  if ((!email && !username) || !password || password.trim() === "") {
    return throwApiError(res, 400, "All Fields are Required");
  }
  //
  //
  //
  //
  //* Validate User
  const trimEmail = email && email.trim();
  const trimUserName = username && username.trim();

  const validateQuery = email
    ? { email: trimEmail }
    : { username: trimUserName };

  const existedUser = await UserModel.findOne(validateQuery);

  // Only Email Use This
  // const existedUser = await UserModel.findOne({email});

  if (!existedUser) {
    return throwApiError(res, 409, "Email or Username Not Found");
  }
  //
  //
  //
  //* Validate User Details
  const passwordCorrect = await existedUser.isPasswordCorrect(password);

  if (!passwordCorrect) return throwApiError(res, 409, "Wrong Password");
  //
  //
  //
  //* Generate Tokens For User
  const { logUser, accessToken, refreshToken } = await generateToken(
    existedUser._id,
    res
  );
  //
  //
  //

  // ***************************************************************************************************/

  //* Send Cookies With Response

  console.log("User Login Successfully");

  return res
    .status(201)
    .cookie("accessToken", accessToken, options) // Storing `accessTokens` Cookies
    .cookie("refreshToken", refreshToken, options) // Storing `refreshToken` Cookies
    .json(
      new ApiResponse(
        200,
        { user: logUser, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});

// ***************************************** Login Controller End **************************************************

// ***************************************** Logout Controller Start ***********************************************

const logoutUser = asyncHandler(async (req, res) => {
  //
  // **********************/
  //? STEPS FOR USER LOGOUT
  // **********************/

  // Get `Use Detail` and `Make Refresh Token Undefined for User`

  //* Get User Detail From `User Authentication Middleware`

  // console.log("User ID from req.user:", req.user._id);

  //* Find User By `User ID` and Update `Refresh Token` to `null`
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

  // **************************************************************************************************

  return res
    .status(201)
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
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access Token Refreshed"
      )
    );
});

// **************************************** Renew Refresh Token End ****************************************

export { registerUser, loginUser, logoutUser, refreshAccessToken };
