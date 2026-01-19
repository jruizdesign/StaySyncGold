import React from 'react';
import Connect from '../components/channex/Connect';

import Status from '../components/channex/Status';
import RoomMapping from '../components/channex/RoomMapping';
import Sync from '../components/channex/Sync';

const ChannelManager = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Channex Channel Manager</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Connect />
          <Status />
        </div>
        <div>
          <RoomMapping />
          <Sync />
        </div>
      </div>
    </div>
  );
};

export default ChannelManager;

