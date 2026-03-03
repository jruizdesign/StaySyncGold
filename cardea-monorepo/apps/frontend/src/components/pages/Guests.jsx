import React, { useState, useEffect } from 'react';
import { getGuests } from '../../services/guests';

const GuestsPage = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const data = await getGuests();
        setGuests(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Guest Profiles (CRM)</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/4 py-2">First Name</th>
              <th className="w-1/4 py-2">Last Name</th>
              <th className="w-1/3 py-2">Email</th>
              <th className="w-1/4 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id} className="text-center border-b">
                <td className="py-2">{guest.id}</td>
                <td className="py-2">{guest.first_name}</td>
                <td className="py-2">{guest.last_name}</td>
                <td className="py-2">{guest.email}</td>
                <td className="py-2">{guest.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestsPage;
