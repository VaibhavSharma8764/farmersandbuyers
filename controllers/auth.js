const jwt = require("jsonwebtoken");
const register = require("../models/userModel.js");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).send("No token, authorization denied");
    }

    const decoded = await jwt.verify(token, process.env.SECRET_KEY); // Check that this is defined
    const user = await register.findOne({ _id: decoded._id });

    if (!user) {
      return res.status(401).send("User not found");
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
};

module.exports = auth;
