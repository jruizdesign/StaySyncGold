import React from 'react';
import { Card, Badge } from '../components/UIComponents';
import { TrendingUp, Users, BedDouble, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock Data - Only shown in Demo Mode
  const mockData = [
    { name: 'Mon', revenue: 4000, occupancy: 65 },
    { name: 'Tue', revenue: 3000, occupancy: 55 },
    { name: 'Wed', revenue: 2000, occupancy: 45 },
    { name: 'Thu', revenue: 2780, occupancy: 50 },
    { name: 'Fri', revenue: 5890, occupancy: 85 },
    { name: 'Sat', revenue: 6390, occupancy: 95 },
    { name: 'Sun', revenue: 5490, occupancy: 80 },
  ];

  const emptyData = [
    { name: 'Mon', revenue: 0, occupancy: 0 },
    { name: 'Tue', revenue: 0, occupancy: 0 },
    { name: 'Wed', revenue: 0, occupancy: 0 },
    { name: 'Thu', revenue: 0, occupancy: 0 },
    { name: 'Fri', revenue: 0, occupancy: 0 },
    { name: 'Sat', revenue: 0, occupancy: 0 },
    { name: 'Sun', revenue: 0, occupancy: 0 },
  ];

  const displayData = user?.isDemoMode ? mockData : emptyData;

  // Stats Fallback
  const stats = user?.isDemoMode ? {
    revenue: "$24,592",
    revenueSub: "+12% from last week",
    occupancy: "78%",
    occupancySub: "+4% from last week",
    checkins: "14",
    checkinsSub: "2 remaining",
    cleaning: "8",
    cleaningSub: "3 pending inspection"
  } : {
    revenue: "$0",
    revenueSub: "No data",
    occupancy: "0%",
    occupancySub: "No data",
    checkins: "0",
    checkinsSub: "No arrivals",
    cleaning: "0",
    cleaningSub: "No tasks"
  };


  const StatCard: React.FC<{ title: string, value: string, sub: string, icon: any, color: string }> = ({ title, value, sub, icon: Icon, color }) => (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          <p className={`text-xs mt-1 ${sub.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>{sub}</p>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </Card>
  );

);

// Removed initial const Dashboard: React.FC = () => { to avoid duplicate declaration error

<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Total Revenue" value={stats.revenue} sub={stats.revenueSub} icon={DollarSign} color="bg-emerald-500 text-emerald-600" />
    <StatCard title="Occupancy Rate" value={stats.occupancy} sub={stats.occupancySub} icon={TrendingUp} color="bg-blue-500 text-blue-600" />
    <StatCard title="Check-Ins Today" value={stats.checkins} sub={stats.checkinsSub} icon={Users} color="bg-gold-500 text-gold-600" />
    <StatCard title="Rooms Cleaning" value={stats.cleaning} sub={stats.cleaningSub} icon={BedDouble} color="bg-rose-500 text-rose-600" />
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card title="Weekly Revenue Overview">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="revenue" fill="#f1b016" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card title="Occupancy Trends">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <Tooltip />
            <Line type="monotone" dataKey="occupancy" stroke="#0f172a" strokeWidth={3} dot={{ r: 4, fill: '#0f172a' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card title="Recent Activity" className="lg:col-span-2">
      <div className="space-y-4">
        {user?.isDemoMode ? [1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
                #{100 + i}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Check-in Processed</p>
                <p className="text-xs text-slate-500">Guest: John Doe • Room 10{i}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400">2 mins ago</span>
          </div>
        )) : <p className="text-slate-500 text-sm text-center py-8">No recent activity.</p>}
      </div>
    </Card>

    <Card title="Urgent Attention">
      <div className="space-y-4">
        {user?.isDemoMode ? (
          <>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Room 304 - Maintenance</p>
                <p className="text-xs text-slate-500 mt-1">AC Failure reported by guest. Priority: High</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Staff Shortage</p>
                <p className="text-xs text-slate-500 mt-1">2 Housekeepers called in sick today.</p>
              </div>
            </div>
          </>
        ) : <p className="text-slate-500 text-sm text-center py-8">No urgent alerts.</p>}
      </div>
    </Card>
  </div>
</div>
  );
};

export default Dashboard;