import React, { useState, useEffect } from 'react';

const Status = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/channex/status?property_id=03b11cee-f7c1-482e-a83b-811a007d9b1c');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status.');
        }
        setStatus(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Channex Connection Status</h2>
      {error && <p className="text-red-600">{error}</p>}
      {status ? (
        <div>
          <p className={`text-lg font-medium ${status.connected ? 'text-green-600' : 'text-red-600'}`}>
            {status.connected ? 'Connected' : 'Not Connected'}
          </p>
          {status.connected && (
            <div className="mt-4">
              <h3 className="text-md font-semibold">Active Channels:</h3>
              <ul className="list-disc list-inside">
                {status.channels.map((channel) => (
                  <li key={channel.id}>{channel.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p>Loading status...</p>
      )}
    </div>
  );
};

export default Status;
