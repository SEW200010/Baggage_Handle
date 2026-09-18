import React, { useState } from 'react';
import axios from 'axios';

export default function SubmitBug() {
  const [formData, setFormData] = useState({
    operation_type: 'Arrival',
    belt_number: 'None',
    box_destination: 'None',
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
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
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
      setAlert({ type: 'success', text: 'Equipment fault successfully logged and transmitted to maintenance control.' });
      setFormData({
        operation_type: 'Arrival',
        belt_number: 'None',
        box_destination: 'None',
        equipment_name: '',
        error_description: ''
      });
      setPhoto(null);
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', text: 'Failed to submit bug report. Please verify backend connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif' }} className="min-h-[calc(100vh-5rem)] bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 mb-8">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white px-8 sm:px-10 py-8 border-b-4 border-amber-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Ground Equipment Incident Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Log baggage belt or sorting equipment malfunctions.</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 tracking-wider">SYSTEM ACTIVE</span>
          </div>
        </div>

        {alert && (
          <div className={`mx-8 sm:mx-10 mt-6 p-4 rounded-xl text-sm font-semibold border ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {alert.text}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
          
          {/* Operation Type Switch */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Operation Sector <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {['Arrival', 'Departure'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData({ ...formData, operation_type: type })}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all shadow-sm ${
                    formData.operation_type === type
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Belt and Box Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Belt Number
              </label>
              <select 
                name="belt_number" 
                value={formData.belt_number} 
                onChange={handleChange} 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="None">None</option>
                {[...Array(24)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Belt {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Destination Box
              </label>
              <select 
                name="box_destination" 
                value={formData.box_destination} 
                onChange={handleChange} 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="None">None</option>
                {['A', 'B', 'C', 'D'].map((box) => (
                  <option key={box} value={box}>Box {box}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Equipment Name / ID
            </label>
            <input 
              type="text" 
              name="equipment_name" 
              value={formData.equipment_name} 
              onChange={handleChange} 
              placeholder="e.g., Belt Motor 12, Sensor Box A" 
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Camera Capture & File Upload Section */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Evidence Photo Attachment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-slate-900 transition bg-slate-50 relative cursor-pointer group flex flex-col items-center justify-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-2xl mb-1">📸</span>
                <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                  Take Photo with Camera
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-slate-900 transition bg-slate-50 relative cursor-pointer group flex flex-col items-center justify-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="text-2xl mb-1">📁</span>
                <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                  Upload from Storage
                </p>
              </div>

            </div>

            {photo && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex justify-between items-center">
                <span>📎 Selected File: {photo.name}</span>
                <button 
                  type="button" 
                  onClick={() => setPhoto(null)} 
                  className="text-rose-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Detailed Error Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Detailed Error Description
            </label>
            <textarea 
              name="error_description" 
              rows="3" 
              value={formData.error_description} 
              onChange={handleChange} 
              placeholder="Describe the malfunction or equipment failure in detail..." 
              className="w-full bg-white border border-slate-300 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            ></textarea>
          </div>

          {/* Professional Submit Button (Fixed & Visible) */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold py-4 rounded-xl text-sm shadow-lg transition-all transform active:scale-95 disabled:opacity-50 border border-amber-500 flex items-center justify-center space-x-2 mt-4"
          >
            <span>{loading ? 'Transmitting Report...' : 'TRANSMIT INCIDENT REPORT ✈️'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}