const express = require('express');
const cors = require('cors');
const connectDB = require('./db/db');
const Home = require('./models/home');
const axios = require('axios');
const Comp = require('./models/comp');
const dayjs = require('dayjs');

const app = express();
const PORT = process.env.PORT || 8080;
require('dotenv').config();

// Middleware
app.use(express.json());

// CORS configuration to allow both local and production origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://hawthorn-reactapp-565258057453.us-central1.run.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type',
  credentials: true
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
  const { range } = req.query;

  // Calculate cutoff date based on range
  let cutoffDate = null;
  const now = dayjs();

  switch (range) {
    case '6months':
      cutoffDate = now.subtract(6, 'month');
      break;
    case '1year':
      cutoffDate = now.subtract(1, 'year');
      break;
    case '2years':
      cutoffDate = now.subtract(2, 'year');
      break;
    default:
      cutoffDate = null; // "all" or no range
  }

  try {
    const homes = await Home.find();
    const formattedHomes = await Promise.all(
      homes.map(async (home) => {
        // Skip homes with missing Sold Date
        if (!home['Sold Date']) return null;

        const parsedSoldDate = dayjs(home['Sold Date'], 'M/D/YYYY');
        if (cutoffDate && !parsedSoldDate.isValid()) return null;
        if (cutoffDate && parsedSoldDate.isBefore(cutoffDate)) return null;

        // Use existing coords or geocode if missing
        if (home.lat && home.lng) {
          return {
            lat: home.lat,
            lng: home.lng,
            address: `${home.Address}, ${home.City}, CA ${home.Zip}`,
            salesPrice: home['Sales Price'],
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

app.get('/api/comps', async (req, res) => {
  try {
    const comps = await Comp.find();
    const formattedComps = await Promise.all(
      comps.map(async (comp) => {
        if (comp.lat && comp.lng) {
          return {
            address: comp.address,
            bedCount: comp.bedCount,
            bathCount: comp.bathCount,
            squareFootage: comp.squareFootage,
            yearBuilt: comp.yearBuilt,
            arv: comp.arv,
            lat: comp.lat,
            lng: comp.lng,
          };
        }
        const coords = await geocodeAddress(comp.address);
        if (coords) {
          await Comp.updateOne({ _id: comp._id }, { lat: coords.lat, lng: coords.lng });
          return {
            address: comp.address,
            bedCount: comp.bedCount,
            bathCount: comp.bathCount,
            squareFootage: comp.squareFootage,
            yearBuilt: comp.yearBuilt,
            arv: comp.arv,
            lat: coords.lat,
            lng: coords.lng,
          };
        }
        return null;
      })
    );
    const validComps = formattedComps.filter((comp) => comp !== null);
    res.json(validComps);
  } catch (error) {
    console.error('Error fetching comps for map:', error);
    res.status(500).json({ error: 'Error fetching comps for map' });
  }
});

app.post('/api/comps', async (req, res) => {
  const { address, bedCount, bathCount, squareFootage, yearBuilt, lotSize, arv } = req.body;

  const newComp = new Comp({
    address,
    bedCount,
    bathCount,
    squareFootage,
    yearBuilt,
    arv,
  });

  try {
    await newComp.save();
    res.status(201).json(newComp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving comp' });
  }
});





// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});