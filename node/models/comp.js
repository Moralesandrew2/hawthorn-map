const mongoose = require('mongoose');

const compSchema = new mongoose.Schema({
    address: String,
    bedCount: Number,
    bathCount: Number,
    squareFootage: Number,
    yearBuilt: Number,
    arv: Number,
    lat: Number,
    lng: Number

  });
  

module.exports = mongoose.model('Comp', compSchema);