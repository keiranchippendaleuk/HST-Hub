const router = require('express').Router()
const passport = require('passport');

router.get('/login', (req, res) => {
    const { message } = req.query;
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }

    if(message) {
        return res.render('login.ejs', { loggedIn: req.isAuthenticated(), message: message })
    } else if (req.headers.referer && !req.headers.referer.includes("/forgot") &&!req.headers.referer.includes("/auth/register") && !req.headers.referer.includes("forgotpassword") && !req.query.redirect) {
        return res.redirect(`/login?redirect=${req.headers.referer.split("login")[0]}`)
    }

    res.render("login.ejs", { loggedIn: req.isAuthenticated(), message: false })
})

router.post('/auth/login', passport.authenticate('local', {
    failureRedirect: '/login?message=Incorrect%20username%20or%20password',
    successRedirect: '/'
}), (req, res) => {

    console.log(req.body)

    if (req.body.remember && req.body.remember == true) {
        res.cookie("remember", true, { maxAge: 1000 * 60 * 60 * 24 * 365 })
        res.cookie("userID", req.user, { maxAge: 1000 * 60 * 60 * 24 * 365 })
    }

    if (req.headers.referer && req.headers.referer.includes("?redirect=")) {
        const redirect = req.headers.referer.split("?redirect=")

        try {
            if (redirect[1].includes('forgot')) {
               return res.redirect("/")
            }

            if (redirect[1].startsWith("http")) {
                res.redirect(`${redirect[1]}`)
            } else {
                res.redirect(`/${redirect[1]}`)
            }

            
        } catch (error) {
            console.log(error)
            res.redirect("/")
        }
    } else {
        res.redirect("/")
    }
})

router.get("/logout", (req, res) => {
    req.session.destroy(function (err) {
        if (err) return res.send(err)
        res.cookie('remember', false)
        res.redirect('/login')
    })
})

module.exports = router;