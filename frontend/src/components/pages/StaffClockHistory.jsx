import React, { useState, useEffect } from 'react';
import { getClockHistory } from '../../services/staff';

const StaffClockHistoryPage = () => {
  const [clockHistory, setClockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClockHistory = async () => {
      try {
        // Assuming property_id 1 for now, will come from auth context later
        const data = await getClockHistory(1);
        setClockHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClockHistory();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Staff Clock History</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/6 py-2">Staff Name</th>
              <th className="w-1/6 py-2">Type</th>
              <th className="w-1/3 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {clockHistory.map((entry) => (
              <tr key={entry.id} className="text-center border-b">
                <td className="py-2">{entry.id}</td>
                <td className="py-2">{entry.firstname} {entry.last_name}</td>
                <td className="py-2">{entry.type}</td>
                <td className="py-2">{new Date(entry.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffClockHistoryPage;
