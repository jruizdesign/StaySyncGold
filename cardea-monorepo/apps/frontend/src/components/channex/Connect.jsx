import React, { useState } from 'react';

const Connect = () => {
  const [apiKey, setApiKey] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/channex/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, propertyMappingId: propertyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify credentials.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Connect to Channex</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
            Channex Property ID
          </label>
          <input
            type="text"
            id="propertyId"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Verify & Connect
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && (
          <p className="mt-2 text-sm text-green-600">
            Successfully verified credentials! You can now proceed to map your rooms.
          </p>
        )}
      </form>
    </div>
  );
};

export default Connect;
