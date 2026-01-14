import React, { useState, useEffect } from 'react';
import { getHousekeepingLogs } from '../../services/housekeeping';

const HousekeepingPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getHousekeepingLogs();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Housekeeping Module</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/6 py-2">Room ID</th>
              <th className="w-1/6 py-2">Staff ID</th>
              <th className="w-1/4 py-2">Status From</th>
              <th className="w-1/4 py-2">Status To</th>
              <th className="w-1/3 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="text-center border-b">
                <td className="py-2">{log.id}</td>
                <td className="py-2">{log.room_id}</td>
                <td className="py-2">{log.staff_id}</td>
                <td className="py-2">{log.status_from}</td>
                <td className="py-2">{log.status_to}</td>
                <td className="py-2">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HousekeepingPage;
