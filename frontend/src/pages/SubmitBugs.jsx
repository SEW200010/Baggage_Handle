import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import departurePlan from '../assets/departure-plan.png';

// Same inspection items are used for every equipment
const CHECKLIST_ITEMS = [
  'Drive roller',
  'Driven roller',
  'Snubber roller',
  'Drive unit',
  'Chain & sprocket',
  'Side board',
  'Lacing & joints',
  'Belt',
  'Guide wheel',
  'Bearing',
  'Nut & bolts'
];

// Tailwind classes are written out in full so the JIT compiler picks them up
const CONDITIONS = [
  { value: 'OK', label: 'OK', header: 'bg-emerald-100 text-emerald-800', radio: 'accent-emerald-600', pill: 'bg-emerald-600 text-white border-emerald-600', dot: 'bg-emerald-500' },
  { value: 'Attention', label: 'Attention', header: 'bg-amber-100 text-amber-800', radio: 'accent-amber-500', pill: 'bg-amber-400 text-black border-amber-400', dot: 'bg-amber-400' },
  { value: 'Defect', label: 'Defect', header: 'bg-rose-100 text-rose-800', radio: 'accent-rose-600', pill: 'bg-rose-600 text-white border-rose-600', dot: 'bg-rose-500' },
  { value: 'N/A', label: 'N/A', header: 'bg-slate-200 text-slate-700', radio: 'accent-slate-600', pill: 'bg-slate-600 text-white border-slate-600', dot: 'bg-slate-400' }
];

const makeEmptyChecklist = () => CHECKLIST_ITEMS.map(item => ({ item, status: '', remarks: '' }));

const getEquipmentLabel = (eq, index) => eq.name || eq.Name || eq['Equipment ID'] || `Equipment ${index + 1}`;

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

  const [equipmentQuery, setEquipmentQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [equipmentError, setEquipmentError] = useState('');

  const [checklist, setChecklist] = useState(makeEmptyChecklist);
  const [checklistError, setChecklistError] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const updateChecklistItem = (index, field, value) => {
    setChecklist(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    setChecklistError('');
  };

  const setAllStatus = (status) => {
    setChecklist(prev => prev.map(row => ({ ...row, status })));
    setChecklistError('');
  };

  const statusCounts = CONDITIONS.map(c => ({
    ...c,
    count: checklist.filter(row => row.status === c.value).length
  })).map(c => ({
    ...c,
    // Share of all checklist items, e.g. 9 of 11 -> 81.8%
    percent: Math.round((c.count / checklist.length) * 1000) / 10
  }));
  const pendingCount = checklist.filter(row => !row.status).length;

  // Fetch equipment list from backend on load
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/equipment`)
      .then(res => setEquipmentList(res.data))
      .catch(err => console.error("Error fetching equipment:", err));
  }, []);

  // Names starting with the typed text come first, then names that merely contain it
  const equipmentSuggestions = (() => {
    const query = equipmentQuery.trim().toLowerCase();
    const labelled = equipmentList.map((eq, index) => ({ eq, label: getEquipmentLabel(eq, index) }));
    if (!query) return labelled;
    const startsWith = labelled.filter(({ label }) => label.toLowerCase().startsWith(query));
    const contains = labelled.filter(({ label }) => {
      const lower = label.toLowerCase();
      return !lower.startsWith(query) && lower.includes(query);
    });
    return [...startsWith, ...contains];
  })();

  // Handle Equipment Selection & Auto-Fill attributes cleanly
  const selectEquipment = (eq, label) => {
    // New equipment -> start a fresh checklist
    setChecklist(makeEmptyChecklist());
    setChecklistError('');
    setEquipmentError('');
    setEquipmentQuery(label);
    setShowSuggestions(false);
    setFormData(prev => ({
      ...prev,
      equipment_name: label,
      equipment_type: eq.type || eq.Type || '',
      location: eq.location || eq.Location || '',
      category: eq.category || eq.Catogory || eq.Category || '',
      belt_number: eq.location || eq.Location || prev.belt_number
    }));
  };

  const handleEquipmentQueryChange = (e) => {
    setEquipmentQuery(e.target.value);
    setShowSuggestions(true);
    setHighlightIndex(0);
    setEquipmentError('');
    // Editing the text drops the previous selection until a new one is picked
    if (formData.equipment_name) {
      setChecklist(makeEmptyChecklist());
      setFormData(prev => ({ ...prev, equipment_name: '', equipment_type: '', location: '', category: '' }));
    }
  };

  const handleEquipmentKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightIndex(i => Math.min(i + 1, equipmentSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && showSuggestions && equipmentSuggestions[highlightIndex]) {
      e.preventDefault();
      const { eq, label } = equipmentSuggestions[highlightIndex];
      selectEquipment(eq, label);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Bold the part of the name that matches what was typed
  const renderHighlighted = (label) => {
    const query = equipmentQuery.trim();
    const start = query ? label.toLowerCase().indexOf(query.toLowerCase()) : -1;
    if (start === -1) return label;
    return (
      <>
        {label.slice(0, start)}
        <span className="text-amber-600 font-extrabold">{label.slice(start, start + query.length)}</span>
        {label.slice(start + query.length)}
      </>
    );
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

    if (!formData.equipment_name) {
      setEquipmentError('Please select an equipment from the list.');
      document.getElementById('equipment-search')?.focus();
      return;
    }

    if (pendingCount > 0) {
      setChecklistError(`Please select a condition for all items (${pendingCount} remaining).`);
      document.getElementById('equipment-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    const data = new FormData();
    for (const key in formData) {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    }
    data.append('checklist', JSON.stringify(checklist));

    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      currentUser = null;
    }
    data.append('submitted_by', currentUser?.name || '');
    data.append('submitted_by_username', currentUser?.username || '');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/bugs`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMessage(`Checklist submitted successfully! Ticket ID: ${res.data.ticketId}`);
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
      setChecklist(makeEmptyChecklist());
      setEquipmentQuery('');
      setPreviewImage(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-8 px-6 lg:px-12 flex justify-center items-center">
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

            {formData.operation_type === 'Departure' && (
              <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold tracking-tight">Departure Layout Plan</h3>
                  <a
                    href={departurePlan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    Open full size ↗
                  </a>
                </div>
                <a href={departurePlan} target="_blank" rel="noopener noreferrer" className="block bg-white">
                  <img
                    src={departurePlan}
                    alt="Departure baggage handling system plan view and 3D view"
                    className="w-full h-auto"
                  />
                </a>
              </div>
            )}
          </div>

          {/* Equipment Selection (type to search) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label htmlFor="equipment-search" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Equipment Name & ID *
              </label>
              <input
                id="equipment-search"
                type="text"
                value={equipmentQuery}
                onChange={handleEquipmentQueryChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                onKeyDown={handleEquipmentKeyDown}
                placeholder="Type equipment name to search..."
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="equipment-suggestions"
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-black focus:outline-none focus:border-amber-400 ${
                  equipmentError ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {showSuggestions && (
                <ul
                  id="equipment-suggestions"
                  role="listbox"
                  className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl"
                >
                  {equipmentSuggestions.length === 0 ? (
                    <li className="px-4 py-3 text-xs font-semibold text-slate-500">
                      No equipment found for "{equipmentQuery}"
                    </li>
                  ) : (
                    equipmentSuggestions.map(({ eq, label }, index) => (
                      <li
                        key={eq._id || index}
                        role="option"
                        aria-selected={index === highlightIndex}
                        // mousedown fires before the input's blur, so the click isn't lost
                        onMouseDown={(e) => { e.preventDefault(); selectEquipment(eq, label); }}
                        onMouseEnter={() => setHighlightIndex(index)}
                        className={`px-4 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 ${
                          index === highlightIndex ? 'bg-amber-50' : 'bg-white'
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">{renderHighlighted(label)}</div>
                        {(eq.type || eq.location) && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {[eq.type, eq.location].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}
              {equipmentError && (
                <p className="mt-1.5 text-xs font-bold text-rose-600">{equipmentError}</p>
              )}
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

          {/* Equipment Condition Checklist (shown once equipment is selected) */}
          {formData.equipment_name && (
            <div id="equipment-checklist" className="scroll-mt-6 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Equipment Condition Checklist</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{formData.equipment_name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllStatus('OK')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition"
                  >
                    Mark All OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllStatus('')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Summary counts & percentages */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  {statusCounts.map(c => (
                    <span key={c.value} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
                      {c.label}: {c.count}
                      <span className="font-bold text-slate-900">({c.percent}%)</span>
                    </span>
                  ))}
                  <span className={`ml-auto ${pendingCount ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {pendingCount ? `${pendingCount} not checked` : 'All items checked'}
                  </span>
                </div>
                <div
                  className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
                  role="img"
                  aria-label={statusCounts.map(c => `${c.label} ${c.percent}%`).join(', ')}
                >
                  {statusCounts.map(c => c.count > 0 && (
                    <div key={c.value} className={c.dot} style={{ width: `${(c.count / checklist.length) * 100}%` }} />
                  ))}
                </div>
              </div>

              {/* DESKTOP / LAPTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-3 w-12 bg-slate-50">No.</th>
                      <th className="px-3 py-3 bg-slate-50">Inspection Item</th>
                      {CONDITIONS.map(c => (
                        <th key={c.value} className={`px-2 py-3 text-center w-24 ${c.header}`}>{c.label}</th>
                      ))}
                      <th className="px-3 py-3 bg-slate-50">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checklist.map((row, index) => (
                      <tr key={row.item} className={row.status ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50'}>
                        <td className="px-3 py-2.5 text-slate-500 font-semibold">{index + 1}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{row.item}</td>
                        {CONDITIONS.map(c => (
                          <td key={c.value} className="px-2 py-2.5 text-center">
                            <input
                              type="radio"
                              name={`condition-${index}`}
                              value={c.value}
                              checked={row.status === c.value}
                              onChange={() => updateChecklistItem(index, 'status', c.value)}
                              aria-label={`${row.item} - ${c.label}`}
                              className={`w-5 h-5 cursor-pointer ${c.radio}`}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => updateChecklistItem(index, 'remarks', e.target.value)}
                            placeholder={row.status === 'Attention' || row.status === 'Defect' ? 'Describe the issue...' : ''}
                            className="w-full min-w-[10rem] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden divide-y divide-slate-100">
                {checklist.map((row, index) => (
                  <div key={row.item} className={`p-4 space-y-2.5 ${row.status ? '' : 'bg-rose-50/40'}`}>
                    <p className="text-sm font-bold text-slate-800">
                      <span className="text-slate-400 mr-1.5">{index + 1}.</span>{row.item}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CONDITIONS.map(c => (
                        <button
                          type="button"
                          key={c.value}
                          onClick={() => updateChecklistItem(index, 'status', c.value)}
                          aria-pressed={row.status === c.value}
                          className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                            row.status === c.value ? c.pill : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => updateChecklistItem(index, 'remarks', e.target.value)}
                      placeholder="Remarks (optional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>

              {checklistError && (
                <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {checklistError}
                </div>
              )}
            </div>
          )}

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
              General Remarks
            </label>
            <textarea
              name="error_description"
              rows="4"
              value={formData.error_description}
              onChange={handleChange}
              placeholder="Any additional remarks about the equipment..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-4 rounded-2xl transition shadow-lg border border-amber-400 text-base"
          >
            {loading ? 'Submitting Checklist...' : 'Submit Checklist'}
          </button>

        </form>
      </div>
    </div>
  );
}
