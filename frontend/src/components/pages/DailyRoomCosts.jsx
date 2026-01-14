import React, { useState, useEffect } from 'react';
import { getDailyRoomCosts } from '../../services/reports';

const DailyRoomCostsPage = () => {
  const [dailyCosts, setDailyCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyCosts = async () => {
      try {
        const data = await getDailyRoomCosts();
        setDailyCosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyCosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Daily Room Costs (Long-Term Guests)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-2">Guest Name</th>
              <th className="py-2">Room Number</th>
              <th className="py-2">Check-in</th>
              <th className="py-2">Check-out</th>
              <th className="py-2">Total Paid</th>
              <th className="py-2">Daily Cost</th>
            </tr>
          </thead>
          <tbody>
            {dailyCosts.map((guest) => (
              <tr key={guest.room_number + guest.check_in} className="text-center border-b">
                <td className="py-2">{guest.first_name} {guest.last_name}</td>
                <td className="py-2">{guest.room_number}</td>
                <td className="py-2">{new Date(guest.check_in).toLocaleDateString()}</td>
                <td className="py-2">{new Date(guest.check_out).toLocaleDateString()}</td>
                <td className="py-2">${parseFloat(guest.total_paid).toFixed(2)}</td>
                <td className="py-2">${parseFloat(guest.daily_cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyRoomCostsPage;
