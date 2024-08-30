require("dotenv").config();
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000; // Default to 3000 if PORT is not set

// Import models and controllers
const register = require("./models/userModel.js");
const auth = require("./controllers/auth.js");

// Set view engine and static file directory
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from 'public' directory

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Serve index.html from 'public' directory
});

// set registeration data
app.post("/register", async (req, resp) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password === confirmPassword) {
      // Create the user object with role-specific fields
      const userData = new register({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role, // 'farmer' or 'buyer'
        password: password,
        confirmPassword: confirmPassword,
        // Include role-specific fields
        ...(req.body.role === "farmer"
          ? {
              farmName: req.body.farmName,
              cropType: req.body.cropType,
            }
          : {}),
        ...(req.body.role === "buyer"
          ? {
              businessName: req.body.businessName,
              productInterest: req.body.productInterest,
            }
          : {}),
      });

      // Save user data
      await userData.save();
      resp.redirect("/login.html");
    } else {
      resp.send("Passwords do not match...");
    }
  } catch (error) {
    resp.status(401).send(error);
  }
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Login check
app.post("/login", async (req, resp) => {
  try {
    let email = req.body.email;
    let password = req.body.password;
    let userEmail = await register.findOne({ email: email });

    if (!userEmail) {
      return resp.status(401).send("Email not found");
    }

    // Match hashed password
    const isMatch = await bcrypt.compare(password, userEmail.password);

    if (isMatch) {
      // Generate token
      let token = await userEmail.generateAuthToken();

      // Set cookie
      resp.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000),
        httpOnly: true,
      });

      // Redirect to home page
      resp.redirect("/home");
    } else {
      resp.status(401).send("Incorrect password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    resp.status(401).send("Authentication failed");
  }
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
//server is running on this port
app.listen(port, () => {
  console.log(`Server is listening to the port ${port}`);
});
