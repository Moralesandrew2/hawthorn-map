const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
    address: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    soldDate: { type: Date, required: true },
    budget: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    listPrice: { type: Number, required: true },
    salesPrice: { type: Number, required: true },
    link: { type: String, required: true },
});

const Home = mongoose.model("Home", homeSchema);
module.exports = Home;
