/* Shitton of Dependencies */

require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const passport = require('passport')
const app = express()
const session = require('express-session')
const flash = require('express-flash')
const path = require('path')
const fs = require('fs')
const cookieParser = require('cookie-parser')

/* Schemas */
const userSchema = require('./schemas/Users')

/* Express Stuff */
app.set("view-engine", "ejs")
app.use(session({
    secret: "secret",
    saveUninitialized: false,
    resave: false
}))
app.use(express.static(path.join(__dirname, "static")))
// app.use(express.json())
// app.use(express.urlencoded({ extended: false }))

/* Passport */
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(flash())
const steamStrategy = require('./auth/passport')
const strategy = new steamStrategy()
strategy.passportstart()

app.use(express.urlencoded({extended: true, limit: "50mb"}));
app.use(express.json({ limit: "50mb" }))

/* Mongoose */
mongoose.connect("mongodb://109.106.1.177:27502/HSTHub", {
    keepAlive: true
})

/* Authentication */

app.use(async (req, res, next) => {
    if (req.isAuthenticated() && req.cookies.remember == "true") {
        const userData = await userSchema.findOne({ userID: req.cookies.userID }) || false;
        if (userData) {
            req.login(String(req.cookies.userID), function (err) {
                if (err) { return next(err); }
            })
        }
    }
    next()
})

/* Routes */
const routes = fs.readdirSync("./routes").filter(r => r.endsWith(".js"))
for (let route of routes) {
    const routes = require(`./routes/${route}`)
    app.use("/", routes)
}

app.set('views', path.join(__dirname, './views'));

// app.use((req, res, next) => {
//     const err = new Error("Page Not Found")
//     err.status = 404
//     next(err)
// })


/* Listen */
const port = 3000;
const server = app.listen(port, async () => {
    console.log(`Server is now up and running on ${port}`)
})
server.setTimeout(0)




