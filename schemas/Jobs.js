const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    id: Number,
    object: String,
    driver: {
        id: Number,
        steam_id: String,
        username: String,
        userID: Number
    },
    planned_distance: Number,
    driven_distance: Number,
    source_city: Object,
    source_company: Object,
    destination_city: Object,
    destination_company: Object,
    cargo: Object,
    submittedDate: String,
    game: Object,
    fuel_used: Number,
    truck: Object,
    events: Array,
    points: Number
})

module.exports = mongoose.model('Jobs', schema)