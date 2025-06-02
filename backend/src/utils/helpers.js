const generateAccessAndRefreshTokens = (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false }); // Save user with new refresh token

  return { accessToken, refreshToken };
};

export { generateAccessAndRefreshTokens };
