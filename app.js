//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    var user_id = req.user.id;
    User.findOne({user_id}, function (err, foundUser) {
      if (foundUser) {
        res.render("secrets", {secret: foundUser.secret});
      } else {
        console.log(err);
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const secret = req.body.secret;
  var user_id = req.user.id;

  User.findById(user_id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      foundUser.secret = secret;
      foundUser.save(function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/register", function (req, res) {
  const email = req.body.username;
  const password = req.body.password;

  User.findOne({ email: email }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        res.send("User already exists");
      } else {
        User.register({ username: email }, password, function (err, user) {
          if (err) {
            console.log(err);
          } else {
            passport.authenticate("local")(req, res, function () {
              res.redirect("/secrets");
            });
          }
        });
      }
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
