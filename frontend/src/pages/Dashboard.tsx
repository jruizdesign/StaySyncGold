import React from 'react';
import { Card, Badge } from '../components/UIComponents';
import { CheckCircle, TrendingUp, Users, BedDouble, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { AIInsightCard } from '../components/AIInsightCard';
import { supabase } from '../lib/supabase';

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

  // Data Fetching
  const [statsData, setStatsData] = React.useState<any>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user?.propertyId) return;
      try {
        setLoadingStats(true); // Don't block UI entirely, maybe show spinner in cards
        const res = await fetch(`/api/reports/dashboard-stats?property_id=${user.propertyId}`);
        const data = await res.json();
        if (data.success) {
          setStatsData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user?.propertyId]);

  // Mock Data (Demo Mode Fallback)
  const mockData = [
    { name: 'Mon', revenue: 4000, occupancy: 65 },
    { name: 'Tue', revenue: 3000, occupancy: 55 },
    // ... rest of mock data can stay if we want fallback, but let's simplify
  ];

  // Determine Display Data
  // If demo mode, use Hardcoded Mock. If Real, use API data.
  const chartData = user?.isDemoMode ? [
    { name: 'Mon', revenue: 4000, occupancy: 65 },
    { name: 'Tue', revenue: 3000, occupancy: 55 },
    { name: 'Wed', revenue: 2000, occupancy: 45 },
    { name: 'Thu', revenue: 2780, occupancy: 50 },
    { name: 'Fri', revenue: 5890, occupancy: 85 },
    { name: 'Sat', revenue: 6390, occupancy: 95 },
    { name: 'Sun', revenue: 5490, occupancy: 80 },
  ] : (statsData?.chartData || []);

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
    revenue: `$${statsData?.stats?.revenue?.toLocaleString() || '0'}`,
    revenueSub: "Total Revenue", // API doesn't return sub-text yet
    occupancy: `${statsData?.stats?.occupancy || 0}%`,
    occupancySub: "Current Occupancy",
    checkins: `${statsData?.stats?.checkins || 0}`,
    checkinsSub: "Arrivals Today",
    cleaning: `${statsData?.stats?.cleaning || 0}`,
    cleaningSub: "Active Tasks"
  };

  // Urgent Tickets Fetching
  const [urgentTickets, setUrgentTickets] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchUrgent = async () => {
      if (!user?.propertyId) return;
      const { data } = await supabase
        .from('maintenance')
        .select('*, rooms(number)')
        .eq('property_id', user.propertyId)
        .in('priority', ['Critical', 'High'])
        .neq('status', 'Resolved')
        .limit(3);
      setUrgentTickets(data || []);
    };

    fetchUrgent();

    // Subscribe to new urgent tickets
    const channel = supabase
      .channel('dashboard-urgent')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maintenance', filter: `property_id=eq.${user?.propertyId}` },
        () => fetchUrgent()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
              <BarChart data={chartData}>
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
              <LineChart data={chartData}>
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
            ) : (
              urgentTickets.length > 0 ? (
                urgentTickets.map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Room {t.rooms?.number} - {t.category || 'Maintenance'}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{t.ai_summary || t.description}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge color="red">{t.priority}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-500 text-sm">No urgent issues requiring attention.</p>
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;