const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("./models/user");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors({ origin: "*" }));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://pawanbhatta00:jD1BZWn5NvyyQSLA@cluster0.mncbiyv.mongodb.net/",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("Connection established");
  })
  .catch((err) => console.log("Error connecting to Mongo : ", err));

app.listen(port, () => {
  console.log("server listening on port 8000");
});

// function to send verification email to the user
const sendVerificationEmail = async (email, token) => {
  // create a nodemailer transport
  const transporter = nodemailer.createTransport({
    // configure the email service
    service: "gmail",
    auth: {
      user: "pawanbhatta00@gmail.com",
      pass: "fbah lura zcdb hhux",
    },
  });

  // compose the email message
  const mailOptions = {
    from: "amazon.com",
    to: email,
    subject: "Email Verification",
    text: `Please click the following link to verify the email : http://127.0.0.1:8000/verify/${token}`,
  };

  // send the email to the user
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending verification email to the user : ", error);
  }
};

// endpoint to register user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if email already registered
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // create a new user
    const newUser = new User({ name, email, password });

    // generate and store verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    // save the new user to the database
    await newUser.save();

    // send verification email to the user
    sendVerificationEmail(newUser.email, newUser.verificationToken);
  } catch (error) {
    console.log("Error registering user : ", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// endpointe to verify the email address
app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    // find the user with given token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    // mark the user as verified
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("Error verifying the email address : ", error);
    res.status(500).json({ message: "Email verification failed" });
  }
});

const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString("hex");
  return secretKey;
};

const secret_key = generateSecretKey();

// endpoint to lofin the user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if the email exists
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // check if password is correct
    if (user.password !== password) {
      return res.status(404).json({ messasge: "Invalid password" });
    }

    // generate a token for the user
    const token = jwt.sign({ userId: user._id }, secret_key);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error while login : ", error);
    res.status(500).json({ message: "Login Failed" });
  }
});

// test endpoint
app.get("/", (req, res) => {
  try {
    console.log("got here");
    res.status(200).json({ message: "Test successful" });
  } catch (error) {
    console.log("Error testing the endpoint : ", error);
    res.status(500).json({ message: "Error while testing endpoint" });
  }
});
