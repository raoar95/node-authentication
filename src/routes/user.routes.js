import { Router } from "express";

/* Controllers */
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controller/user.controller.js";

/* Middleware */
import { userTokenAuth } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

/* Secured Routes */
userRouter.route("/logout").post(userTokenAuth, logoutUser);

userRouter.route("/refresh-token").post(refreshAccessToken);

export default userRouter;
