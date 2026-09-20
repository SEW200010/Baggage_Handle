const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: String,
  Name: String,
  type: String,
  Type: String,
  location: String,
  Location: String,
  category: String,
  Catogory: String,
  Category: String,
  status: String,
  Status: String,
  'Equipment ID': String
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('Equipment', equipmentSchema, 'equipment');
