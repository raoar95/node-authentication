import { Router } from "express";

/* Controllers */
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyOtp,
  requestResetPassword,
  resetPassword,
  isAuth,
  refreshAccessToken,
} from "../controller/user.controller.js";

/* Middleware */
import { userTokenAuth } from "../middlewares/auth.middleware.js";

//=================================================== Routes Start ===================================================

/* UnSecured Routes */
const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

userRouter.route("/request-reset-password").post(requestResetPassword);

userRouter.route("/email-otp-login").post(requestResetPassword);

/* Secured Routes */
userRouter.route("/logout").post(userTokenAuth, logoutUser);

userRouter.route("/verify-otp").post(userTokenAuth, verifyOtp);

userRouter.route("/verify-email-otp-login").post(userTokenAuth, verifyOtp);

userRouter.route("/reset-password").post(userTokenAuth, resetPassword);

userRouter.route("/renew-refresh-token").get(userTokenAuth, refreshAccessToken);

userRouter.route("/isAuth").get(userTokenAuth, isAuth);

//=================================================== Routes End ===================================================

export default userRouter;
