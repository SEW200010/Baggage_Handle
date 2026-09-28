const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  operation_type: { type: String, required: true },
  equipment_name: { type: String, required: true },
  equipment_type: { type: String, default: '' },
  location: { type: String, default: '' },
  category: { type: String, default: '' },
  issue_type: { type: String, default: 'None' },
  severity: { type: String, default: 'None' },
  error_description: { type: String, default: '' },
  checklist: [{
    _id: false,
    item: { type: String, required: true },
    status: { type: String, enum: ['OK', 'Attention', 'Defect', 'N/A'], required: true },
    remarks: { type: String, default: '' }
  }],
  photo_path: { type: String, default: null },
  submitted_by: { type: String, default: '' },
  submitted_by_username: { type: String, default: '' },
  status: { type: String, default: 'Pending' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

module.exports = mongoose.model('Bug', bugSchema);
