const express = require("express");
const cors = require("cors");
const connectDB = require("./db/db");
const Home = require("./models/home");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

connectDB();

// Get all homes
app.get("/sold-homes", async (req, res) => {
    try {
        const homes = await Home.find();
        res.json(homes);
    } catch (error) {
        res.status(500).json({ error: "Error fetching homes" });
    }
});

// Add a new home
app.post("/sold-homes", async (req, res) => {
    try {
        const newHome = new Home(req.body);
        await newHome.save();
        res.status(201).json(newHome);
    } catch (error) {
        res.status(400).json({ error: "Error adding home" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
