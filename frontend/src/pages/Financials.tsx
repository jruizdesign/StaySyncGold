import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: string;
  guest_name: string;
  total_price: number;
  currency: string;
  status: string;
  arrival_date: string;
  departure_date: string;
  room_type: string;
  source: string;
}

const Financials: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertyId = user?.propertyId;

  useEffect(() => {
    if (propertyId) {
      fetchBookings();
    }
  }, [propertyId]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/channex/bookings?property_id=${propertyId}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
  const activeBookings = bookings.filter(b => b.status !== 'cancelled').length;
  const currency = bookings[0]?.currency || 'USD';

  if (loading) return <div className="p-8">Loading Financials...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Financial Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">
            {currency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-800">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Reservations</h3>
          <p className="text-3xl font-bold text-gray-800">{activeBookings}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{booking.guest_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{booking.room_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(booking.arrival_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                  {booking.currency} {Number(booking.total_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financials;