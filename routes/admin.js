const router = require('express').Router()
const userSchema = require("../schemas/Users");
const jobSchema = require("../schemas/Jobs")

router.get('/admin', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: req.user }) || false;

        if (userData) {
            if (user.admin === true) {
                const today = new Date().toLocaleDateString();
                const userCount = await userSchema.countDocuments() || 0;
                const jobCount = await jobSchema.coundDocuments() || 0;

                res.render('admin.ejs', {
                    userCount: userCount,
                    todaydate: today,
                    jobCount: jobCount
                })
            } else {
                res.redirect('/')
            }
        } else {
            res.status(404).json({ error: 'We could not find your user in the database.' })
        }
    } else {
        res.redirect('/login')
    }
})





module.exports = router;