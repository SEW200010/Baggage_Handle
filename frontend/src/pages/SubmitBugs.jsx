import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, CheckCircle2 } from 'lucide-react';

export default function SubmitBugs() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [formData, setFormData] = useState({
    operation_type: 'Arrival',
    belt_number: '',
    box_destination: '',
    equipment_name: '',
    equipment_type: '',
    location: '',
    category: '',
    issue_type: 'None',
    severity: 'None',
    belt_stopped: false,
    error_description: '',
    error_photo: null
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch equipment list from backend on load
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/equipment`)
      .then(res => setEquipmentList(res.data))
      .catch(err => console.error("Error fetching equipment:", err));
  }, []);

  // Handle Equipment Selection & Auto-Fill attributes cleanly
  const handleEquipmentChange = (e) => {
    const selectedValue = e.target.value;
    const matchedEquipment = equipmentList.find(eq => 
      eq.name === selectedValue || 
      eq.Name === selectedValue || 
      eq.equipment_id === selectedValue ||
      `${eq.name} (${eq.equipment_id})` === selectedValue
    );

    if (matchedEquipment) {
      const eqName = matchedEquipment.name || matchedEquipment.Name || selectedValue;
      setFormData(prev => ({
        ...prev,
        equipment_name: eqName,
        equipment_type: matchedEquipment.type || matchedEquipment.Type || '',
        location: matchedEquipment.location || matchedEquipment.Location || '',
        category: matchedEquipment.category || matchedEquipment.Catogory || matchedEquipment.Category || '',
        belt_number: matchedEquipment.location || matchedEquipment.Location || prev.belt_number
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        equipment_name: selectedValue,
        equipment_type: '',
        location: '',
        category: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, error_photo: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/bugs`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMessage(`Fault report submitted successfully! Ticket ID: ${res.data.ticketId}`);
      setFormData({
        operation_type: 'Arrival',
        belt_number: '',
        box_destination: '',
        equipment_name: '',
        equipment_type: '',
        location: '',
        category: '',
        issue_type: 'None',
        severity: 'None',
        belt_stopped: false,
        error_description: '',
        error_photo: null
      });
      setPreviewImage(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-100 py-8 px-6 lg:px-12 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-slate-900 text-white p-8 border-b-4 border-amber-400 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ground Equipment Incident Portal</h2>
          </div>
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SYSTEM ACTIVE
          </div>
        </div>

        {successMessage && (
          <div className="m-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Operation Sector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Operation Sector *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['Arrival', 'Departure'].map((sector) => (
                <button
                  type="button"
                  key={sector}
                  onClick={() => setFormData(prev => ({ ...prev, operation_type: sector }))}
                  className={`py-3 rounded-2xl font-bold text-sm border transition shadow-sm ${
                    formData.operation_type === sector
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Selection (Clean Dropdown without duplication) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Equipment Name & ID *
              </label>
              <select
                name="equipment_name"
                value={formData.equipment_name}
                onChange={handleEquipmentChange}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-black focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Select Equipment from Register --</option>
                {equipmentList.map((eq, index) => (
                  <option key={index} value={eq.name}>
                    {eq.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Equipment Type
              </label>
              <input
                type="text"
                name="equipment_type"
                value={formData.equipment_type}
                readOnly
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Filtered Location & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                readOnly
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                readOnly
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          
            
          {/* Evidence Photo Attachment Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Evidence Photo Attachment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-slate-100 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">Take Photo with Camera</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>

              <label className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-slate-100 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">Upload from Storage</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>

            {previewImage && (
              <div className="mt-4 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <img src={previewImage} alt="Preview" className="w-16 h-16 object-cover rounded-xl border" />
                <span className="text-xs font-semibold text-slate-700">Photo attached successfully</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Detailed Error Description *
            </label>
            <textarea
              name="error_description"
              rows="4"
              required
              value={formData.error_description}
              onChange={handleChange}
              placeholder="Describe the malfunction or equipment failure in detail..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-4 rounded-2xl transition shadow-lg border border-amber-400 text-base"
          >
            {loading ? 'Submitting Report...' : 'Submit Equipment Fault Report'}
          </button>

        </form>
      </div>
    </div>
  );
}