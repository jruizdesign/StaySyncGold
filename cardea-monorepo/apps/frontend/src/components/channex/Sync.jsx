import React, { useState, useEffect } from 'react';

const Sync = () => {
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchLastSync = async () => {
      try {
        const response = await fetch('/api/channex/sync?property_id=03b11cee-f7c1-482e-a83b-811a007d9b1c');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch last sync status.');
        setLastSync(data.last_sync);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchLastSync();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/channex/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: '03b11cee-f7c1-482e-a83b-811a007d9b1c' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to trigger sync.');
      setLastSync(new Date().toISOString()); // Or use the timestamp from the server if available
      alert(`Sync Complete. Fetched ${data.bookingsFetched} bookings.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Manual Sync</h2>
      {error && <p className="text-red-600">{error}</p>}
      <p className="text-sm text-gray-600">
        Last Sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
      </p>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {syncing ? 'Syncing...' : 'Sync Bookings Now'}
      </button>
    </div>
  );
};

export default Sync;
