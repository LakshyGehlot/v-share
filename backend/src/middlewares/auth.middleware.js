import jwt from "jsonwebtoken";
import asynchandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { generateAccessAndRefreshTokens } from "../utils/helpers.js";
import { cookieOptions } from "../constants.js";

// Verification flow
// 1. Check if access token is provided in cookies or headers (Since mobile apps cannot use cookies so also check headers)
// 2. If access token is valid, decode it and get user details
// 3. If access token is expired, check for refresh token in cookies or headers
// 4. If refresh token is valid, generate new access token and refresh token
// 5. Set new access token and refresh token in cookies and headers

const verify = asynchandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers["x-access-authorization"].spplit(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("Access token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    req.user = user;
    return next();
  } catch (error) {
    // If token is expired, try using refresh token
    if (error.name === "TokenExpiredError") {
      const refreshToken =
        req.cookies?.refreshToken || req.headers["x-refresh-token"];

      if (!refreshToken) {
        throw ApiError.unauthorized("Refresh token is required");
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      } catch {
        throw ApiError.unauthorized("Invalid or expired refresh token");
      }

      const user = await User.findById(decoded.id).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        throw ApiError.unauthorized("Invalid refresh token");
      }

      const { accessToken, refreshToken: newRefreshToken } =
        generateAccessAndRefreshTokens(user);

      res.cookie("accessToken", accessToken, cookieOptionss);
      res.cookie("refreshToken", newRefreshToken, cookieOptionss);
      res.setHeader("authorization", `Bearer ${accessToken}`);
      res.setHeader("x-refresh-token", newRefreshToken);

      req.user = user;
      return next();
    }

    // Other JWT errors (e.g., invalid token)
    throw ApiError.unauthorized("Invalid access token");
  }
});

export default verify;
