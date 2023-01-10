const router = require('express').Router();
const userSchema = require('../schemas/Users');
const jobSchema = require("../schemas/Jobs");

router.get('/', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;
        const driverCount = await userSchema.countDocuments() || 0;
        const jobs = await jobSchema.find().sort({'_id': -1}).limit(15) || [];
        const jobCount = await jobSchema.countDocuments() || 0;
    

        const stats = {
            income: 0,
            drivers: driverCount,
            jobs: jobs.length,
        }


        jobs.forEach((j) => {
            const deliveredEvent = j.events.find(f => f.type == "delivered") || false;
            const income = deliveredEvent.revenue

            stats.income += Math.round(income)
        })

        

        res.render('index.ejs', {
            user: userData,
            jobs,
            stats: stats,
            jobCount
        })
    } else {
        res.redirect('/login')
    }
})

router.get('/roster', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;
        const members = await userSchema.find() || false;

        members.sort((a, b) => {
            return b.points - a.points
        })


        res.render('roster.ejs', {
            user: userData,
            members: members
        })
    } else {
        res.redirect('/login')
    }
})

router.get('/jobs', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;
        const jobs = await jobSchema.find().sort({'_id': -1}) || [];

        res.render('job.ejs', {
            user: userData,
            jobs: jobs
        })
    } else {
        res.redirect('/login')
    }
})

router.get('/jobs/:id', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;

        const job = await jobSchema.findOne({ id: req.params.id }) || false;

        if (job) {
            res.render('eachjob.ejs', {
                job,
                user: userData
            })
        }
    } else {
        res.redirect('/login')
    }
})

router.get('/profile/:user', async (req, res, next) => {
    if (req.isAuthenticated()) {
        const { user } = req;
        const userData = await userSchema.findOne({ userID: user }) || false;
        const driverJobs = await jobSchema.find({ 'driver.userID': req.params.user }).sort({'_id': -1}) || [];
        
        const driver = await userSchema.findOne({ userID: req.params.user }) || false;
        const driverJoined = new Date(driver.joined).toLocaleDateString('en-US')



        if (driver) {
            res.render('profile.ejs', {
                user: userData,
                driverJoined,
                jobs: driverJobs,
                driver: driver
            })
        } else {
           res.status(400).json({ error: 'Could not find user.'})
        }
    } else {
        res.redirect('/login')
    }
})

module.exports = router;