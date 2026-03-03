import React, { useState, useEffect } from 'react';
import { getReservations } from '../../services/reservations';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await getReservations();
        setReservations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-4">Reservation Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/6 py-2">ID</th>
              <th className="w-1/6 py-2">Guest ID</th>
              <th className="w-1/6 py-2">Room ID</th>
              <th className="w-1/4 py-2">Check-in</th>
              <th className="w-1/4 py-2">Check-out</th>
              <th className="w-1/6 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="text-center border-b">
                <td className="py-2">{reservation.id}</td>
                <td className="py-2">{reservation.guest_id}</td>
                <td className="py-2">{reservation.room_id}</td>
                <td className="py-2">{new Date(reservation.check_in).toLocaleDateString()}</td>
                <td className="py-2">{new Date(reservation.check_out).toLocaleDateString()}</td>
                <td className="py-2">{reservation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReservationsPage;
