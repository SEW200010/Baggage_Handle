import React, { useState } from 'react';
import axios from 'axios';

export default function SubmitBug() {
  const [formData, setFormData] = useState({
    operation_type: 'Arrival',
    belt_number: '1',
    box_destination: 'A',
    equipment_name: '',
    error_description: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (photo) {
      data.append('error_photo', photo);
    }

    try {
      await axios.post('http://localhost:5000/api/bugs', data);
      setAlert({ type: 'success', text: 'Bug report successfully submitted.' });
      setFormData({
        operation_type: 'Arrival',
        belt_number: '1',
        box_destination: 'A',
        equipment_name: '',
        error_description: ''
      });
      setPhoto(null);
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', text: 'Failed to submit report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-8 px-4 flex justify-center">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Equipment Bug Reporting Form</h2>
        <p className="text-sm text-slate-500 mb-6">Log ground equipment malfunctions or faults below.</p>

        {alert && (
          <div className={`mb-4 p-3 rounded text-sm font-medium border ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {alert.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Operation Type</label>
            <select 
              name="operation_type" 
              value={formData.operation_type} 
              onChange={handleChange} 
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
            >
              <option value="Arrival">Arrival</option>
              <option value="Departure">Departure</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Belt Number (1 - 24)</label>
              <select 
                name="belt_number" 
                value={formData.belt_number} 
                onChange={handleChange} 
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Belt {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Box Destination</label>
              <select 
                name="box_destination" 
                value={formData.box_destination} 
                onChange={handleChange} 
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                {['A', 'B', 'C', 'D'].map((box) => (
                  <option key={box} value={box}>Box {box}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Equipment Name / ID</label>
            <input 
              type="text" 
              name="equipment_name" 
              value={formData.equipment_name} 
              onChange={handleChange} 
              placeholder="e.g., Belt Motor 12" 
              required 
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Error Description</label>
            <textarea 
              name="error_description" 
              rows="3" 
              value={formData.error_description} 
              onChange={handleChange} 
              placeholder="Describe the issue..." 
              required 
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Attach Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-300 rounded" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded text-sm transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}