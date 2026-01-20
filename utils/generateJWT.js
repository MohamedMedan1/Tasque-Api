const jwt = require("jsonwebtoken");

const generateJWTAndSendRes = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  res.status(200).json({
    status: "success",
    token,
    user,
  });
};

module.exports = generateJWTAndSendRes;
