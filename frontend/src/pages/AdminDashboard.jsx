import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const [bugs, setBugs] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState(null);

  // Date Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter bugs by Date Range
  const filteredBugs = bugs.filter(bug => {
    if (!bug.created_at) return true;
    const bugDate = new Date(bug.created_at);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (bugDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (bugDate > end) return false;
    }

    return true;
  });

  // Edit Modal State
  const [editingBug, setEditingBug] = useState(null);
  const [formData, setFormData] = useState({
    operation_type: 'Arrival',
    belt_number: '',
    box_destination: '',
    equipment_name: '',
    equipment_type: '',
    location: '',
    category: '',
    issue_type: '',
    severity: '',
    error_description: '',
    status: 'Pending'
  });

  // Live Clock for Header Bar
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBugs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/bugs');
      setBugs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/equipment');
      setEquipmentList(res.data);
    } catch (err) {
      console.error('Error fetching equipment list:', err);
    }
  };

  useEffect(() => {
    fetchBugs();
    fetchEquipment();
  }, []);

  // Handle Equipment Selection in Edit Modal (Auto fill related attributes if available)
  const handleEquipmentChange = (e) => {
    const selectedName = e.target.value;
    const matchedEquipment = equipmentList.find(eq => eq.name === selectedName);

    if (matchedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipment_name: matchedEquipment.name,
        equipment_type: matchedEquipment.Type || matchedEquipment.type || prev.equipment_type,
        location: matchedEquipment.Location || matchedEquipment.location || prev.location,
        category: matchedEquipment.Catogory || matchedEquipment.category || prev.category
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        equipment_name: selectedName
      }));
    }
  };

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    try {
      await axios.put(`http://localhost:5000/api/bugs/${id}`, { status: newStatus });
      fetchBugs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident report?')) {
      try {
        await axios.delete(`http://localhost:5000/api/bugs/${id}`);
        fetchBugs();
      } catch (err) {
        console.error(err);
        alert('Failed to delete report.');
      }
    }
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    // Normalize Windows backslashes (\) to web forward slashes (/)
    let normalizedPath = photoPath.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `http://localhost:5000/api/view-photo?path=${encodeURIComponent(cleanPath)}`;
  };

  // Open Edit Modal and populate data
  const handleEditClick = (bug) => {
    setEditingBug(bug._id || bug.id);
    setFormData({
      operation_type: bug.operation_type || 'Arrival',
      belt_number: bug.belt_number || '',
      box_destination: bug.box_destination || '',
      equipment_name: bug.equipment_name || '',
      equipment_type: bug.equipment_type || '',
      location: bug.location || '',
      category: bug.category || '',
      issue_type: bug.issue_type || '',
      severity: bug.severity || '',
      error_description: bug.error_description || '',
      status: bug.status || 'Pending'
    });
  };

  // Handle Form Input Changes in Modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Edited Data to Backend
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/bugs/${editingBug}`, formData);
      setEditingBug(null); // Close modal
      fetchBugs(); // Refresh table
    } catch (err) {
      console.error('Update report error:', err);
      alert(err.response?.data?.error || 'Failed to update report.');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // PDF Download Function (Exporting Filtered Records)
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("GBS MachFix - Maintenance Operations Report", 14, 15);
    
    doc.setFontSize(10);
    const dateRangeText = (startDate || endDate)
      ? `Date Filter: ${startDate || 'Start'} to ${endDate || 'Today'}`
      : 'Date Filter: All Time Records';
    doc.text(`Generated: ${new Date().toLocaleString()}  |  ${dateRangeText}`, 14, 22);

    const tableColumn = ["Date & Time", "Sector", "Equipment Name", "Type", "Location", "Category", "Status"];
    const tableRows = [];

    filteredBugs.forEach(bug => {
      const rowData = [
        new Date(bug.created_at).toLocaleString(),
        bug.operation_type,
        bug.equipment_name,
        bug.equipment_type || 'N/A',
        bug.location || 'N/A',
        bug.category || 'N/A',
        bug.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36] }
    });

    const fileName = (startDate || endDate) 
      ? `GBS_MachFix_Report_${startDate || 'start'}_to_${endDate || 'end'}.pdf` 
      : 'GBS_MachFix_Report_All.pdf';

    doc.save(fileName);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-12 relative">
      <div className="w-full space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-b-4 border-amber-400 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Maintenance Operations</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-slate-800 border border-slate-700 px-5 py-1 rounded-xl text-right">
              <span className="text-[11px] font-bold text-amber-400 block">
                {currentDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 tracking-wider">
                {currentDateTime.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={downloadPDF} 
                className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-md border border-amber-500"
              >
                PDF
              </button>
              <button 
                onClick={fetchBugs} 
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs sm:text-sm px-4 py-3.5 rounded-xl transition shadow-md border border-slate-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Controls Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              📅 Date Filter:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">From</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">To</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition"
              >
                Clear Filter ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
              Showing {filteredBugs.length} of {bugs.length} Reports
            </span>
          </div>
        </div>

        {/* Table / Card Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500 font-bold">Loading incident records...</div>
          ) : filteredBugs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500 font-bold">No fault reports match the selected date range.</div>
          ) : (
            <>
              {/* DESKTOP / LAPTOP TABLE VIEW (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-200 text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 sm:px-6 py-4">Date & Time</th>
                      <th className="px-4 sm:px-6 py-4">Sector</th>
                      <th className="px-4 sm:px-6 py-4">Equipment Name</th>
                      <th className="px-4 sm:px-6 py-4">Type</th>
                      <th className="px-4 sm:px-6 py-4">Location</th>
                      <th className="px-4 sm:px-6 py-4">Category</th>
                      <th className="px-4 sm:px-6 py-4">Description</th>
                      <th className="px-4 sm:px-6 py-4">Photo</th>
                      <th className="px-4 sm:px-6 py-4">Status</th>
                      <th className="px-4 sm:px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-800 bg-white font-medium">
                    {filteredBugs.map((bug) => (
                      <tr key={bug._id || bug.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 sm:px-6 py-4 text-xs font-semibold text-slate-600">
                          {formatDateTime(bug.created_at)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            bug.operation_type === 'Arrival' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {bug.operation_type}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-slate-900">{bug.equipment_name}</td>
                        <td className="px-4 sm:px-6 py-4 text-slate-600">{bug.equipment_type || 'N/A'}</td>
                        <td className="px-4 sm:px-6 py-4 text-slate-600">{bug.location || 'N/A'}</td>
                        <td className="px-4 sm:px-6 py-4 text-slate-600 font-semibold">{bug.category || 'N/A'}</td>
                        <td className="px-4 sm:px-6 py-4 text-slate-600 max-w-xs truncate">{bug.error_description}</td>
                        <td className="px-4 sm:px-6 py-4">
                          {bug.photo_path ? (
                            <button 
                              type="button"
                              onClick={() => setSelectedImage(getPhotoUrl(bug.photo_path))} 
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                            >
                              View Photo
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No Photo</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <button 
                            onClick={() => updateStatus(bug._id || bug.id, bug.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm ${
                              bug.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {bug.status} 
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center space-x-2">
                          <button 
                            onClick={() => handleEditClick(bug)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(bug._id || bug.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD STACK VIEW (Displayed only on screens smaller than md) */}
              <div className="block md:hidden p-4 space-y-4 bg-slate-100/60">
                {filteredBugs.map((bug) => (
                  <div key={bug._id || bug.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
                    {/* Top Info Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                          bug.operation_type === 'Arrival' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {bug.operation_type}
                        </span>
                        <button 
                          onClick={() => updateStatus(bug._id || bug.id, bug.status)}
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition shadow-sm ${
                            bug.status === 'Resolved' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {bug.status}
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formatDateTime(bug.created_at)}
                      </span>
                    </div>

                    {/* Equipment Main Info */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{bug.equipment_name}</h4>
                      <div className="flex flex-wrap gap-1.5 text-xs text-slate-600 mt-1.5">
                        {bug.equipment_type && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">Type: {bug.equipment_type}</span>
                        )}
                        {bug.location && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">Loc: {bug.location}</span>
                        )}
                        {bug.category && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">Cat: {bug.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Error Description */}
                    {bug.error_description && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-bold text-slate-800 block mb-0.5">Description:</span>
                        {bug.error_description}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {bug.photo_path ? (
                          <button 
                            type="button"
                            onClick={() => setSelectedImage(getPhotoUrl(bug.photo_path))} 
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1"
                          >
                            📷 View Photo
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No Photo</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(bug)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(bug._id || bug.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* EDIT MODAL FORM */}
      {editingBug && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-900 text-white p-6 border-b-4 border-amber-400 flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Equipment Report</h3>
              <button 
                onClick={() => setEditingBug(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Operation Sector</label>
                  <select 
                    name="operation_type" 
                    value={formData.operation_type} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Equipment Name *</label>
                  <select 
                    name="equipment_name" 
                    value={formData.equipment_name} 
                    onChange={handleEquipmentChange}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="">-- Select Equipment --</option>
                    {equipmentList.map((eq, index) => (
                      <option key={index} value={eq.name}>
                        {eq.name}
                      </option>
                    ))}
                    {formData.equipment_name && !equipmentList.some(eq => eq.name === formData.equipment_name) && (
                      <option value={formData.equipment_name}>
                        {formData.equipment_name}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Equipment Type</label>
                  <input 
                    type="text" 
                    name="equipment_type" 
                    value={formData.equipment_type} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Location</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Category</label>
                  <input 
                    type="text" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                  />
                </div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Error Description</label>
                <textarea 
                  name="error_description" 
                  rows="3"
                  value={formData.error_description} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBug(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-400 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* INLINE POPUP IMAGE PREVIEW MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-700 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b-4 border-amber-400">
              <div className="flex items-center gap-2">
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="bg-slate-800 hover:bg-rose-600 text-white rounded-xl px-4 py-1.5 text-xs font-bold transition flex items-center gap-1 border border-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950 overflow-auto min-h-[300px]">
              <img
                src={selectedImage}
                alt="Incident Evidence"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                onError={(e) => {
                  console.error("Error loading image from URL:", selectedImage);
                }}
              />
            </div>

            
            
          </div>
        </div>
      )}

    </div>
  );
}