const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  operation_type: { type: String, required: true },
  equipment_name: { type: String, required: true },
  equipment_type: { type: String, default: '' },
  location: { type: String, default: '' },
  category: { type: String, default: '' },
  issue_type: { type: String, default: 'None' },
  severity: { type: String, default: 'None' },
  error_description: { type: String, required: true },
  photo_path: { type: String, default: null },
  status: { type: String, default: 'Pending' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

module.exports = mongoose.model('Bug', bugSchema);
