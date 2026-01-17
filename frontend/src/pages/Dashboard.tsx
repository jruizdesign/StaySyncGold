import React from 'react';
import { Card, Badge } from '../components/UIComponents';
import { TrendingUp, Users, BedDouble, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { AIInsightCard } from '../components/AIInsightCard';

import { useAuth } from '../context/AuthContext';

const StatCard: React.FC<{ title: string, value: string, sub: string, icon: any, color: string }> = ({ title, value, sub, icon: Icon, color }) => (
  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${sub.includes('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
          {sub.includes('+') && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          {sub}
        </p>
      </div>
      <div className={`p-3.5 rounded-xl ${color} bg-opacity-10 backdrop-blur-sm`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // AI Insights State
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(true);

  React.useEffect(() => {
    const fetchInsights = async () => {
      // Only fetch if we have a property ID
      if (!user?.propertyId) return;

      try {
        setLoadingInsights(true);
        const { getPropertyInsights } = await import('../services/aiService');
        const data = await getPropertyInsights(user.propertyId);
        setAiInsights(data);
      } catch (err) {
        console.error('Failed to fetch AI insights:', err);
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchInsights();

    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.propertyId]);

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

  return (
    <div className="space-y-6">
  // AI Insights State
      const [aiInsights, setAiInsights] = React.useState<any>(null);
        const [loadingInsights, setLoadingInsights] = React.useState(true);

  React.useEffect(() => {
    const fetchInsights = async () => {
      // Only fetch if we have a property ID
      if (!user?.propertyId) return;

        try {
          setLoadingInsights(true);
        const {getPropertyInsights} = await import('../services/aiService');
        const data = await getPropertyInsights(user.propertyId);
        setAiInsights(data);
      } catch (err) {
          console.error('Failed to fetch AI insights:', err);
      } finally {
          setLoadingInsights(false);
      }
    };

        fetchInsights();

        // Refresh every 5 minutes
        const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.propertyId]);

        return (
        <div className="space-y-6">
          {/* AI Intel Card */}
          <AIInsightCard
            title={aiInsights?.title}
            subtitle={aiInsights?.subtitle}
            message={aiInsights?.message}
            actionLabel={aiInsights?.actionLabel}
            variant={aiInsights?.variant || 'default'}
            loading={loadingInsights}
            error={aiInsights?.error}
            timestamp={aiInsights?.generatedAt}
            onAction={() => window.location.href = '/maintenance'} // Navigate based on context in future
          />

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
            <Card title="Live System Feed" className="lg:col-span-2">
              <LiveActivityFeed />
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