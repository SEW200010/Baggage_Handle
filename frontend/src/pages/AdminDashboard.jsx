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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Maintenance Dashboard</h2>
            <p className="text-sm text-slate-500">Overview of reported equipment issues and repair status.</p>
          </div>
          <button 
            onClick={fetchBugs} 
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded transition"
          >
            Refresh Table
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">Loading data...</div>
          ) : bugs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No fault reports registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-6 py-3">Operation</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Equipment</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Photo</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-700 bg-white">
                  {bugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{bug.operation_type}</td>
                      <td className="px-6 py-4">Belt {bug.belt_number} (Box {bug.box_destination})</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{bug.equipment_name}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{bug.error_description}</td>
                      <td className="px-6 py-4">
                        {bug.photo_path ? (
                          <a 
                            href={`http://localhost:5000${bug.photo_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          bug.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {bug.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => updateStatus(bug.id, bug.status)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          Change Status
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