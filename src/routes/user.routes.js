import { Router } from "express";

/* Controllers */
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyOtp,
  requestResetPassword,
  resetPassword,
  refreshAccessToken,
} from "../controller/user.controller.js";

/* Middleware */
import { userTokenAuth } from "../middlewares/auth.middleware.js";

//=================================================== Routes Start ===================================================

/* UnSecured Routes */
const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

userRouter.route("/renew-refresh-token").post(refreshAccessToken);

userRouter.route("/request-reset-password").post(requestResetPassword);

/* Secured Routes */
userRouter.route("/logout").post(userTokenAuth, logoutUser);

userRouter.route("/verify-otp").post(userTokenAuth, verifyOtp);

userRouter
  .route("/reset-password/:randomText")
  .post(userTokenAuth, resetPassword);

//=================================================== Routes End ===================================================

export default userRouter;
