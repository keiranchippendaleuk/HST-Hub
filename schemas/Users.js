const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    username: String,
    email: String,
    steamID: String,
    userID: Number,
    points: Number,
    distance: Number,
    jobs: Number,
    role: String,   
    avatar: String,
    games: Array,
    password: String,
    staff: Boolean,
    admin: Boolean,
    joined: String,
    resetString: String,
    discord: Object
})

module.exports = mongoose.model("Users", schema)