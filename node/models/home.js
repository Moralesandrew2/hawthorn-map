const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  Address: {
    type: String,
    required: true,
  },
  City: {
    type: String,
    required: true,
  },
  Zip: {
    type: String, // Stored as string to preserve leading zeros (e.g., "92110")
    required: true,
  },
  'Purchase Date': {
    type: String, // Stored as string based on your example ("6/21/2024")
    required: true,
  },
  'Sold Date': {
    type: String,
    required: true,
  },
  Budget: {
    type: String, // Stored as string due to "$" symbol ("$149,968.50")
    required: true,
  },
  'Purchase Price': {
    type: String, // Stored as string due to "$" symbol ("$1,125,000.00")
    required: true,
  },
  'List Price': {
    type: String,
    required: true,
  },
  'Sales Price': {
    type: String, // Stored as string ("1,660,000.00")
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  lat: {
    type: Number, // Optional, for storing geocoded latitude
    required: false,
  },
  lng: {
    type: Number, // Optional, for storing geocoded longitude
    required: false,
  },
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true,
});

// Export the model
module.exports = mongoose.model('Home', homeSchema);