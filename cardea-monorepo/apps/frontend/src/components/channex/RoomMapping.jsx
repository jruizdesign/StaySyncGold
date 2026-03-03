import React, { useState, useEffect } from 'react';

const RoomMapping = () => {
  const [localRooms, setLocalRooms] = useState([]);
  const [channexRooms, setChannexRooms] = useState([]);
  const [mappings, setMappings] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [localRes, channexRes] = await Promise.all([
          fetch('/api/channex/rooms/local?property_id=03b11cee-f7c1-482e-a83b-811a007d9b1c'),
          fetch('/api/channex/rooms/remote?property_id=03b11cee-f7c1-482e-a83b-811a007d9b1c'),
        ]);

        const localData = await localRes.json();
        const channexData = await channexRes.json();

        if (!localRes.ok) throw new Error(localData.error || 'Failed to fetch local rooms.');
        if (!channexRes.ok) throw new Error(channexData.error || 'Failed to fetch Channex rooms.');

        setLocalRooms(localData.roomTypes);
        setChannexRooms(channexData.rooms);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const handleMappingChange = (localRoomType, channexRoomId) => {
    setMappings((prev) => ({ ...prev, [localRoomType]: channexRoomId }));
  };

  const handleSaveMappings = async () => {
    try {
      const response = await fetch('/api/channex/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: '03b11cee-f7c1-482e-a83b-811a007d9b1c', mappings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save mappings.');
      alert('Mappings saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Room Type Mapping</h2>
      {error && <p className="text-red-600">{error}</p>}
      <div className="space-y-4">
        {localRooms.map((localRoom) => (
          <div key={localRoom} className="flex items-center justify-between">
            <span className="font-medium">{localRoom}</span>
            <select
              value={mappings[localRoom] || ''}
              onChange={(e) => handleMappingChange(localRoom, e.target.value)}
              className="mt-1 block w-1/2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select Channex Room</option>
              {channexRooms.map((channexRoom) => (
                <option key={channexRoom.id} value={channexRoom.id}>
                  {channexRoom.attributes.title}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        onClick={handleSaveMappings}
        className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Mappings
      </button>
    </div>
  );
};

export default RoomMapping;
