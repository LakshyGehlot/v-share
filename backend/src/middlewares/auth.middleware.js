import jwt from "jsonwebtoken";
import asynchandler from "../utils/asynchandler.js";
import User from "../models/user.model.js";

const verify = asynchandler(async (req, res, next) => {
  const token =
    req.cookies?.refreshToken || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

export default verify;
