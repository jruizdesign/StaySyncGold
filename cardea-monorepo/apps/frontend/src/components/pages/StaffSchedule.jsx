import React, { useState, useEffect } from 'react';
import { getSchedules } from '../../services/schedules';

const StaffSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await getSchedules();
        setSchedules(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Staff Schedule</h1>
      {/* Schedule list and form will go here */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/6 py-2">Staff ID</th>
              <th className="w-1/6 py-2">Date</th>
              <th className="w-1/6 py-2">Start Time</th>
              <th className="w-1/6 py-2">End Time</th>
              <th className="w-1/4 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="text-center border-b">
                <td className="py-2">{schedule.id}</td>
                <td className="py-2">{schedule.staff_id}</td>
                <td className="py-2">{new Date(schedule.shift_date).toLocaleDateString()}</td>
                <td className="py-2">{schedule.start_time}</td>
                <td className="py-2">{schedule.end_time}</td>
                <td className="py-2">{schedule.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffSchedulePage;
