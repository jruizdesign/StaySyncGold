import React from 'react';
import { Card, Button, Select, Badge } from '../components/UIComponents';
import { ClipboardList, Plus } from 'lucide-react';
import { MOCK_ROOMS } from '../constants';
import { RoomStatus } from '../types';

const Housekeeping: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Housekeeping Management</h1>
        <Button icon={Plus}>New Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Clean & Ready</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">12</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Dirty / In-Progress</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">4</p>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Inspected</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">8</p>
        </div>
      </div>

      <Card title="Room Status List">
        <div className="space-y-2">
          {MOCK_ROOMS.map(room => (
            <div key={room.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700">
                  {room.number}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{room.type}</p>
                  <p className="text-xs text-slate-500">Floor {room.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Select className="text-sm min-w-[140px]">
                  <option>Clean</option>
                  <option>Dirty</option>
                  <option>Inspected</option>
                  <option>Out of Order</option>
                </Select>
                <Badge color={room.status === RoomStatus.CLEAN ? 'green' : 'amber'}>{room.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Housekeeping;