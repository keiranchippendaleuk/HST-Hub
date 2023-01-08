const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
const db = require('croxydb')
const userSchema = require('../schemas/Users')

class passport {
    async passportstart() {
        const RegularStrategy = require('passport-local').Strategy
        const SteamStrategy = require('passport-steam').Strategy
        const passport = require('passport')
        const bcrypt = require('bcrypt')

        passport.serializeUser((user, done) => {
            done(null, user)
        })

        passport.deserializeUser((id, done) => {
            done(null, id)
        })

        const authenticateUser = async (email, password, done) => {
            const user = await userSchema.findOne({ email: email.toLowerCase() }) || false;

            if (!user) {
                return done(null, false, { message: "User not found." })
            }



            try {
                if (await bcrypt.compare(password, user.password) || password === user.password) {
                    return done(null, user.userID)
                } else {
                    return done(null, false, { message: "Password incorrect." })
                }
            } catch (err) {
                done(err)
            }
        }

        passport.use(new RegularStrategy({ usernameField: "email" }, authenticateUser))
        passport.use(new SteamStrategy({
            returnURL: process.env.SteamReturn,
            realm: process.env.baseurl,
            apiKey: process.env.STEAM_API
        }, async (identifier, profile, done) => {
            const  { id, displayName, photos } = profile;

            const ID = await userSchema.findOne({ steamID: id }) || false;
            if (ID) {
                return done(false, null, { message: "That Steam ID has already been registered." });
            }

            done(null, profile)
        }))
    }
}

module.exports = passport;