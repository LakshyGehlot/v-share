import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { cookieOptions } from "../constants.js";
import { generateAccessAndRefreshTokens } from "../utils/helpers.js";

// User registration controller
// 1. Check if all required fields are provided
// 2. Check if the user already exists with the same email or username
// 3. Check if avatar and coverImage are provided,
//    avatar is required, coverImage is optional
// 4. Create a new user and save it to the database
// 5. Generate access and refresh tokens for the user
// 6. Set the tokens in cookies and return the user details in the response
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (!username || !email || !fullname || !password) {
    throw ApiError.badRequest("All fields are required");
  }

  let avatar = "";
  let coverImage = "";

  if (!req.files.avatar || req.files.avatar.length === 0) {
    throw ApiError.badRequest("Avatar image is required");
  }
  avatar = req.files.avatar[0].path;

  if (req.files.coverImage && req.files.coverImage.length > 0) {
    coverImage = req.files.coverImage[0].path;
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw ApiError.badRequest(
        "A User already exists with this email or username"
      );
    }

    const newUser = new User({
      username,
      email,
      fullname,
      password,
      avatar,
      coverImage,
    });

    await newUser.save();

    const { accessToken, refreshToken } =
      generateAccessAndRefreshTokens(newUser);

    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(201)
      .json(
        ApiResponse.created("User registered successfully", {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullname: newUser.fullname,
            avatar,
            coverImage,
          },
          accessToken,
        })
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(error.status, error.message);
    }

    throw ApiError.internalServerError(
      "An error occurred while registering the user"
    );
  }
});

// Login User Controller
export const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw ApiError.badRequest("Identifier and password are required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password +refreshToken");

  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.badRequest("Invalid identifier or password");
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user);

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json(
      ApiResponse.success("User logged in successfully", {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullname: user.fullname,
          avatar: user.avatar,
          coverImage: user.coverImage,
        },
        accessToken,
      })
    );
});

// Logout User (secured route)
export const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;

  await User.findByIdAndUpdate(user._id, { refreshToken: "" });

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(ApiResponse.success("User logged out successfully"));
});
