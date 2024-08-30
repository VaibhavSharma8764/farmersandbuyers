require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log("DB connection Successful");
});

const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    uppercase: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email");
      }
    },
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["farmer", "buyer"],
    required: true,
  },
  // Fields for farmers
  farmName: {
    type: String,
    required: function () {
      return this.role === "farmer";
    },
  },
  cropType: {
    type: String,
    required: function () {
      return this.role === "farmer";
    },
  },
  // Fields for buyers
  businessName: {
    type: String,
    required: function () {
      return this.role === "buyer";
    },
  },
  productInterest: {
    type: String,
    required: function () {
      return this.role === "buyer";
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

//generate tokens
userSchema.methods.generateAuthToken = async function () {
  try {
    const token = await jwt.sign(
      { _id: this._id.toString() },
      process.env.SECRET_KEY
    );
    this.tokens = this.tokens.concat({ token: token });
    await this.save();
    return token;
  } catch (error) {
    // Throw the error so it can be handled by the caller
    throw new Error("Token generation failed");
  }
};

// hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
    this.confirmPassword = await bcrypt.hash(this.password, 10);

    // //for removing of (confirmPassowrd) field in database
    this.confirmPassword = undefined;
  }
  next();
});
let register = mongoose.model("users", userSchema);
module.exports = register;
