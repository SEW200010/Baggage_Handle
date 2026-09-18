import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBugs();
  }, []);

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pending' ? 'Resolved' : 'Pending';
    try {
      await axios.put(`http://localhost:5000/api/bugs/${id}`, { status: newStatus });
      fetchBugs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif' }} className="min-h-[calc(100vh-5rem)] bg-slate-100 py-8 px-6 lg:px-12">
      <div className="w-full space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border-b-4 border-amber-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Maintenance Operations Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">Overview of reported equipment issues and repair status across all 24 belts.</p>
          </div>
          <button 
            onClick={fetchBugs} 
            className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-md border border-amber-500"
          >
            Refresh Table
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500 font-bold">Loading incident records...</div>
          ) : bugs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500 font-bold">No fault reports registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Operation</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Equipment</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Photo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-800 bg-white font-medium">
                  {bugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          bug.operation_type === 'Arrival' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {bug.operation_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        Belt {bug.belt_number} <span className="text-slate-400">/ Box {bug.box_destination}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{bug.equipment_name}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{bug.error_description}</td>
                      <td className="px-6 py-4">
                        {bug.photo_path ? (
                          <a 
                            href={`http://localhost:5000${bug.photo_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                          >
                            View Photo
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No Photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          bug.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {bug.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => updateStatus(bug.id, bug.status)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}