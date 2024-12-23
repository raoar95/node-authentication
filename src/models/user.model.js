import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    // username: {
    //   type: String,
    //   required: false,
    //   unique: true,
    //   lowercase: true,
    //   trim: true,
    //   index: true,
    // },
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
    // avatar: {
    //   type: String,
    //   required: true,
    // },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//? `mongoose` `pre Middleware` Use to Run Code Before Event Like `save` Happens.

//* Encrypt Password Data
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//* Create `isPasswordCorrect` Method to Compare Password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//
//
//* Tokens are Generally Used for User Authentication

//* Eg -> User Cannot Buy Product Without Login, When User Login, Token is Generated and Sent to User,

//* Now, User have Access of Account Till Token Expiry

// 1. Access Token (SHORT DURATION EXPIRY) [ Eg - USER LOGOUT AFTER SPECIFIED TIME LIKE 15 MINUTES ]

// 2. Refresh Token (LONG DURATION EXPIRY) [ Eg -REMEMBER USER ]

//* Create `generateAccessToken` Method to Generate `Access Token` for `UserSchema`
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

//* Create `generateRefreshToken` Method to Generate `Refresh Token` for `UserSchema`
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

export const UserModel = mongoose.model("User", userSchema);
