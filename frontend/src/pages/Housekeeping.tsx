import React from 'react';
import { Card, Badge, Select } from '../components/UIComponents';
import { MOCK_ROOMS } from '../constants';
import { RoomStatus } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

const Housekeeping: React.FC = () => {
  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.CLEAN: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case RoomStatus.DIRTY: return <XCircle className="w-5 h-5 text-rose-500" />;
      case RoomStatus.INSPECT: return <Clock className="w-5 h-5 text-amber-500" />;
      case RoomStatus.OOO: return <AlertTriangle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: RoomStatus) => {
     switch (status) {
      case RoomStatus.CLEAN: return "border-emerald-500 bg-emerald-50";
      case RoomStatus.DIRTY: return "border-rose-500 bg-rose-50";
      case RoomStatus.INSPECT: return "border-amber-500 bg-amber-50";
      case RoomStatus.OOO: return "border-slate-500 bg-slate-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Room Status Overview</h2>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Clean
              <span className="w-3 h-3 rounded-full bg-rose-500 ml-2"></span> Dirty
              <span className="w-3 h-3 rounded-full bg-amber-500 ml-2"></span> Inspect
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_ROOMS.map((room) => (
          <div key={room.id} className={`relative p-4 rounded-xl border-l-4 shadow-sm bg-white transition-all hover:shadow-md ${getStatusColor(room.status)}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-bold text-slate-800">{room.number}</h3>
              {getStatusIcon(room.status)}
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">{room.type}</span>
              <span className="text-xs text-slate-400">Floor {room.floor}</span>
            </div>

            <div className="space-y-2">
               <select 
                defaultValue={room.status}
                className="w-full text-xs p-2 rounded border border-slate-200 bg-white focus:ring-2 focus:ring-gold-500 outline-none"
               >
                 {Object.values(RoomStatus).map(s => (
                   <option key={s} value={s}>{s}</option>
                 ))}
               </select>
               <div className="text-xs text-slate-500 flex justify-between">
                 <span>Assignee:</span>
                 <span className="font-medium text-slate-700">Unassigned</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Housekeeping;