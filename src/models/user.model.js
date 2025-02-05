import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    otpAuth: {
      otp: { type: String, required: false, default: "" },
      sendTime: { type: Number, required: false, default: 0 },
      expireTime: { type: Number, required: false, default: 0 },
      token: { type: String, required: false, default: "" },
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt Password Data
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Create `isPasswordCorrect` Method to Compare Password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Create `generateAccessToken` Method to Generate `Access Token` for `UserSchema`
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      // username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Create `generateRefreshToken` Method to Generate `Refresh Token` for `UserSchema`
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
