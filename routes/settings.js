const router = require("express").Router();
const userSchema = require("../schemas/Users");
const fs = require('fs');
const bcrypt = require('bcrypt')
const crypto = require('crypto')

router.get('/settings', async (req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            const { user } = req;
            const userData = await userSchema.findOne({ userID: user }) || false;

            res.render('settings.ejs', {
                user: userData
            })
        } else {
            res.redirect('/login')
        }
    } catch (err) {
        console.log(err)
    }
})

router.get('/settings/avatar/remove', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;

        if (userData) {
            userData.avatar = "https://i.imgur.com/820FceD.png"
            userData.save()

            res.redirect('/settings')
        } else {
            res.sendStatus(404)
        }
    } else {
        res.redirect('/login')
    }
})

router.post('/settings/password', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const { password } = req.body;

        const userData = await userSchema.findOne({ userID: user }) || false;

        if (userData) {
            const hashedPassword = await bcrypt.hash(String(password), 10);

            userData.password = hashedPassword;
            userData.save();

            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    } else {
        res.redirect('/login')
    }
})

router.post('/settings/avatar', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const base64body = req.body.avatar;
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;

        if (userData) {
            var decodedBase = base64(base64body)
            var buffer = decodedBase.data;
            var type = decodedBase.type.replace("image/", "")

            var filename = `${generateString("png")}.${type}`
            fs.writeFile(`./static/avatars/${filename}`, buffer, async (err) => {
                if (err) throw err;
                userData.avatar = `https://hub.highspeedtrucking.ca/avatars/${filename}`
                userData.save();
                res.sendStatus(200)
            })
        } else {
            res.sendStatus(404)
        }


    } else {
        res.redirect('/login')
    }
})


router.post('/settings/user', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const { username, email } = req.body;

        const userData = await userSchema.findOne({ userID: user }) || false;

        if (userData) {
            userData.email = email;
            userData.username = username;
            userData.save()

            res.sendStatus(200)
        } else {
            res.sendStatus(404)
        }
    } else {
        res.redirect('/login')
    }
})

function generateString(ext) {
    const str = crypto.randomBytes(12).toString("hex");
    if (fs.existsSync(`./files/${str}.${ext}`)) {
      return generateString();
    } else {
      return str;
    }
  }
  
function base64(dataStr) {
    var matches = dataStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  
    if (matches.length !== 3) {
      return new Error("Invalid data");
    }
  
    response.type = matches[1];
    response.data = new Buffer.from(matches[2], "base64");
  
    return response;
  }



module.exports = router;