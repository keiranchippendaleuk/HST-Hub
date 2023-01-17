const router = require('express').Router();
const Canvas = require('canvas')
Canvas.registerFont(`static/fonts/DMSans-Regular.ttf`, { family: "DM Sans" })
Canvas.registerFont(`static/fonts/DMSans-Bold.ttf`, { family: "DM Sans Bold" })


const userModel = require('../schemas/Users')
const jobModel = require('../schemas/Jobs')

router.get('/banner/:id', async (req, res, next) => {
    const { id } = req.params;
    const userData = await userModel.findOne({ userID: id }) || false;

    if (!userData) {
        return res.status(404).json({ message: 'Could not find that user.' })
    }

    const userJobs = await jobModel.find({ "driver.userID": id });

    try {
        let canvas = Canvas.createCanvas(800, 150)
        let ctx = canvas.getContext('2d')

        let background = await Canvas.loadImage("static/img/HSTBannerTemplate.png")

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
        // // ctx.strokeStyle = '#fdfdfd';
        // ctx.strokeRect(0, 0, canvas.width, canvas.height)

        // Username
        ctx.font = '24px DM Sans Bold';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'right';
        ctx.fillText(userData.username, canvas.width / 1.2, canvas.height / 1.75);

        // Total Jobs
        ctx.font = 'bold 18px DM Sans Bold';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left'
        ctx.fillText(Math.round(userJobs.length || 0).toLocaleString(), canvas.width / 7.5, canvas.height / 3.5)

        // Rank
        ctx.font = 'bold 18px DM Sans Bold';
        ctx.fillStyle = '#FFF'
        ctx.textAlign = 'left';
        ctx.fillText(userData.role, canvas.width / 8.55, canvas.height / 1.82)

        // Total Points
        ctx.font = '18px DM Sans Bold'
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(userData.points || 0).toLocaleString(), canvas.width / 6.85, canvas.height / 1.23)

        ctx.beginPath();
        ctx.arc(725, 75.5, 50, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();

        let avatar = await Canvas.loadImage(userData.avatar)

        ctx.drawImage(avatar, 670, 25, 110, 110)

        res.set({ "content-type": "image/png"})
        res.send(canvas.toBuffer())
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'An error occured: ' + err })
    }
})

module.exports = router;