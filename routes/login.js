const router = require("express").Router();
const passport = require("passport");
const userSchema = require("../schemas/Users");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/login", (req, res) => {
  const { message } = req.query;
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  if (message) {
    return res.render("login.ejs", {
      loggedIn: req.isAuthenticated(),
      message: message,
    });
  } else if (
    req.headers.referer &&
    !req.headers.referer.includes("/forgot") &&
    !req.headers.referer.includes("/auth/register") &&
    !req.headers.referer.includes("forgotpassword") &&
    !req.query.redirect
  ) {
    return res.redirect(
      `/login?redirect=${req.headers.referer.split("login")[0]}`
    );
  }

  res.render("login.ejs", { loggedIn: req.isAuthenticated(), message: false });
});

router.post(
  "/auth/login",
  passport.authenticate("local", {
    failureRedirect: "/login?message=Incorrect%20username%20or%20password",
    successRedirect: "/",
  }),
  (req, res) => {
    console.log(req.body);

    if (req.body.remember && req.body.remember == true) {
      res.cookie("remember", true, { maxAge: 1000 * 60 * 60 * 24 * 365 });
      res.cookie("userID", req.user, { maxAge: 1000 * 60 * 60 * 24 * 365 });
    }

    res.redirect("/");
  }
);

router.get("/forgot", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    res.render("forgot.ejs");
  }
});

router.post("/auth/forgot", async (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    const { email } = req.body;
    const userData = (await userSchema.findOne({ email: email })) || false;

    if (userData) {
      function makeid(length) {
        var result = "";
        var characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
          );
        }
        return result;
      }

      const string = await makeid(10);
      userData.resetString = string;
      userData.save();

      const msg = {
        to: userData.email,
        from: `contact@highspeedtrucking.ca`,
        subject: `HighSpeed Trucking Password Reset`,
        html: `Click the following link to reset your password: https://hub.highspeedtrucking.ca/forgot/${userData.resetString}`,
      };

      sgMail.send(msg).catch((error) => {
        console.log(error.response.body);
        res.redirect("/forgot/done");
      });

      res.redirect("/forgot");
    } else {
      res.status(400).json({ error: "Could not find user." });
    }
  }
});

router.get("/forgot/:string", async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    const { string } = req.params;
    const userData =
      (await userSchema.findOne({ resetString: string })) || false;

    if (userData) {
      res.render("reset.ejs", { email: userData.email });
    } else {
      res.status(400).json({ error: "Invalid reset string." });
    }
  }
});

router.post("/auth/reset", async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  } else {
    const { email, password } = req.body;
    const userData = (await userSchema.findOne({ email: email })) || false;

    if (userData) {
      const hashedPassword = await bcrypt.hash(String(password), 10);

      userData.password = hashedPassword;
      userData.resetString = null;
      userData.save();

      res.redirect("/login");
    } else {
      res.status(400).json({ error: "Could not find user." });
    }
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) return res.send(err);
    res.cookie("remember", false);
    res.redirect("/login");
  });
});

module.exports = router;
