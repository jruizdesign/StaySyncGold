import React, { useState } from 'react';
import { clockIn, clockOut } from '../../services/staff';

const StaffKioskPage = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handlePinInput = (digit) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
    setMessage('');
  };

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      // Assuming property_id 1 for now
      const data = await clockIn(pin, 1);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    try {
      // Assuming property_id 1 for now
      const data = await clockOut(pin, 1);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-80 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">Staff Kiosk</h1>
        <div className="w-full h-12 mb-4 bg-gray-200 rounded-md flex items-center justify-center text-2xl tracking-widest">
          {pin.replace(/./g, '*')}
        </div>

        {error && <div className="text-red-500 text-center mb-2">{error}</div>}
        {message && <div className="text-green-500 text-center mb-2">{message}</div>}

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              className="w-full h-16 text-2xl bg-gray-300 hover:bg-gray-400 rounded-md"
              onClick={() => handlePinInput(digit)}
              disabled={loading}
            >
              {digit}
            </button>
          ))}
          <button
            className="w-full h-16 text-2xl bg-red-500 hover:bg-red-600 text-white rounded-md"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </button>
          <button
            className="w-full h-16 text-2xl bg-gray-300 hover:bg-gray-400 rounded-md"
            onClick={() => handlePinInput(0)}
            disabled={loading}
          >
            0
          </button>
          <button className="w-full h-16 text-2xl" />
        </div>
        <div className="flex justify-between mt-4">
          <button
            className="w-1/2 mr-1 py-2 text-white bg-green-500 hover:bg-green-600 rounded-md"
            onClick={handleClockIn}
            disabled={loading || pin.length === 0}
          >
            {loading ? '...' : 'Clock In'}
          </button>
          <button
            className="w-1/2 ml-1 py-2 text-white bg-yellow-500 hover:bg-yellow-600 rounded-md"
            onClick={handleClockOut}
            disabled={loading || pin.length === 0}
          >
            {loading ? '...' : 'Clock Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffKioskPage;
