const router = require("express").Router();
const passport = require("passport");
const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
const userSchema = require("../schemas/Users");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const db = require('croxydb')

router.use(bodyParser.json());

router.get("/apply", async (req, res, next) => {
  const { message } = req.query;
  const { user } = req;
  
  res.render("apply.ejs", {
    message: message || false,
    user: user ? (typeof user === "object" ? user : false) : false,
  });
});

// router.get("/approve/application/:id", async (req, res, next) => {
//   try {
//     if (req.isUnauthenticated() && req.cookies.remember == "true") {
//       const avblUserData =
//         (await membersSchema.findOne({ userID: req.cookies.userID })) || false;
//       if (avblUserData) {
//         req.login(String(req.cookies.userID), function (err) {
//           if (err) {
//             return next(err);
//           }
//         });
//       }
//     }

//     const { user } = req;

//     if (req.isAuthenticated()) {
//       const userData = (await userSchema.findOne({ userID: user })) || false;

//       const application =
//         (await applicationSchema.findOne({ _id: req.params.id })) || false;

//       if (!application) {
//         return res.status(404);
//       }

//       const dbdata = (await userSchema.find()) || [];
//       const filteredData = dbdata.find((d) => d.username == application?.username && d.email.toLowerCase() == application?.data?.email.toLowerCase()) || false;

//       if (filteredData) {
//         return res.send({
//             error: true,
//             success: false,
//             message: 'User already exists.'
//         })
//       }

//       await applicationSchema.findOneAndUpdate(
//         { _id: req.params.id },
//         {
//           "data.status": "Approved",
//           "data.claimedBy": userData.username,
//           "data.claimedByID": userData.userID,
//         }
//       );

//       const password = Date.now();
//       addUser(
//         application?.steamID,
//         application?.username,
//         application?.email,
//         password
//       );

//       res.send({
//         error: false,
//         success: true,
//         message: "Application Approved",
//       })
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });

router.post("/apply", async (req, res, next) => {
  try {
    addUser(
      req.body.steam,
      req.body.username,
      req.body.email,
      req.body.password
    )

    /* SendGrid, send email, account has been created include password and email address */

    req.session.destroy();

    res.redirect('/login')
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.get("/steam/connect", passport.authenticate("steam"));
router.get(
  "/redirect",
  passport.authenticate("steam", {
    failureRedirect: "/error",
    successRedirect: "/apply",
  }),
  function (req, res) {
    res.sendStatus(200);
  }
);

router.get("/error", (req, res, next) => {
  res.render("error.ejs");
});

async function addUser(steamID, username, email, password) {
  addTrackerUser(steamID);

  const avatar = "https://i.imgur.com/820FceD.png";

  let userID = db.get("userID") || 0;
  const currentID = ++userID;
  db.set("userID", currentID);

  try {
    fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API}&steamid=${steamID}&format=json`
    )
      .then((res) => {
        return res.json();
      })
      .then(async (resp) => {
        let ets2;
        let ats;

        try {
          ets2 = resp.response.games.find((g) => g.appid == "227300");
        } catch (error) {
          ets2 = false;
        }

        try {
          ats = resp.response.games.find((g) => g.appid == "270880");
        } catch (error) {
          ats = false;
        }

        let games = [];

        if (ets2) {
          games.push("ets2");
        }

        if (ats) {
          games.push("ats");
        }

        try {
          const hashedPassword = await bcrypt.hash(String(password), 10);

          const userData = {
            username: username,
            email: email.toLowerCase(),
            steamID: steamID,
            userID: currentID,
            jobs: 0,
            role: "Driver",
            avatar: avatar,
            games: games,
            staff: false,
            admin: false,
            joined: Date.now(),
            password: hashedPassword,
            distance: 0,
            points: 0,
          };

          await new userSchema(userData).save();
        } catch (err) {
          console.log(err);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
}

function addTrackerUser(id) {
  fetch(`https://api.truckershub.in/v1/drivers`, {
    method: "POST",
    headers: {
      "Authorization": `${process.env.truckershub}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      steamID: String(id),
    }),
  })
    .then((body) => {
      return body.json();
    })
    .then(async (json) => {
      if (json.error) {
        console.log(json);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

module.exports = router;
