import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./constant/constant.js";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // Limit JSON size to 16KB
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Limit URL-encoded size to 16KB
app.use(express.static("public/assets")); // Any `static files saves` in the `public/assets` directory
app.use(cookieParser()); // Parse cookies from the request

app.get("/", (req, res) => {
  res.send("Namaste Express JS!");
});

// Routes imports
import userRouter from "./routes/user.routes.js";

// Routes Middleware Declarations
app.use("/users", userRouter);

export { app };
