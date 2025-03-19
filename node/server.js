const express = require('express');
const cors = require('cors');
const connectDB = require('./db/db');
const Home = require('./models/home');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: ['https://hawthorn-reactapp-565258057453.us-central1.run.app'], // Your frontend Cloud Run URL
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type',
};
app.use(cors(corsOptions));

// Connect to MongoDB
connectDB();

// Google Maps API key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Geocode address function
const geocodeAddress = async (address, city, zip) => {
  const fullAddress = `${address}, ${city}, CA ${zip}`;
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: fullAddress,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error('Geocoding failed:', response.data.status);
      return null;
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
};

// Routes

app.get('/api/homes', async (req, res) => {
    try {
      const homes = await Home.find();
      const formattedHomes = await Promise.all(
        homes.map(async (home) => {
          if (home.lat && home.lng) {
            return {
              lat: home.lat,
              lng: home.lng,
              address: `${home.Address}, ${home.City}, CA ${home.Zip}`,
              salesPrice: home['Sales Price'], // Include additional fields
              soldDate: home['Sold Date'],
              link: home.link,
            };
          }
          const coords = await geocodeAddress(home.Address, home.City, home.Zip);
          if (coords) {
            await Home.updateOne({ _id: home._id }, { lat: coords.lat, lng: coords.lng });
            return {
              lat: coords.lat,
              lng: coords.lng,
              address: `${home.Address}, ${home.City}, CA ${home.Zip}`,
              salesPrice: home['Sales Price'],
              soldDate: home['Sold Date'],
              link: home.link,
            };
          }
          return null;
        })
      );
      const validHomes = formattedHomes.filter((home) => home !== null);
      res.json(validHomes);
    } catch (error) {
      console.error('Error fetching homes for map:', error);
      res.status(500).json({ error: 'Error fetching homes for map' });
    }
  });
  
  

// Existing endpoint: Get all homes (raw data)
app.get('/sold-homes', async (req, res) => {
  try {
    const homes = await Home.find();
    res.json(homes);
  } catch (error) {
    console.error('Error fetching homes:', error);
    res.status(500).json({ error: 'Error fetching homes' });
  }
});

// Add a new home
app.post('/sold-homes', async (req, res) => {
  try {
    const newHome = new Home(req.body);
    await newHome.save();
    res.status(201).json(newHome);
  } catch (error) {
    console.error('Error adding home:', error);
    res.status(400).json({ error: 'Error adding home' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});