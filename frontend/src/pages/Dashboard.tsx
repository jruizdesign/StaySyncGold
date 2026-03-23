import React from 'react';
import { Card, Badge } from '../components/UIComponents';
import { CheckCircle, TrendingUp, Users, BedDouble, DollarSign, ShieldCheck, Sparkles, Zap, KeyRound, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { AIInsightCard } from '../components/AIInsightCard';
import { SaaSMiniLock } from '../components/SaaSMiniLock';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const StatCard: React.FC<{ title: string, value: string, sub: string, icon: any, color: string, delay?: number }> = ({ title, value, sub, icon: Icon, color, delay = 0 }) => (
  <Card delay={delay} className="hover:-translate-y-1 transition-transform duration-300 group relative overflow-hidden border-0 bg-white/60">
    <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
      <Icon className="w-32 h-32 text-slate-900" />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-600 tracking-wide uppercase">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${sub.includes('+') ? 'text-emerald-700' : 'text-slate-500'}`}>
          {sub.includes('+') && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          {sub}
        </p>
      </div>
      <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 backdrop-blur-md border border-white/20 shadow-sm`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user, session } = useAuth();

  // AI Insights State
  const [aiInsights, setAiInsights] = React.useState<any>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(true);
  const [aiEnabled, setAiEnabled] = React.useState(false);

  React.useEffect(() => {
      const checkAiFeat = async () => {
          if (user?.propertyId) {
              const { data } = await supabase.from('properties').select('enable_ai').eq('id', user.propertyId).single();
              if (data?.enable_ai) setAiEnabled(true);
          }
      };
      checkAiFeat();
  }, [user?.propertyId]);

  // Tenancy Alerts State
  const [tenancyAlerts, setTenancyAlerts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchTenancyRisks = async () => {
      if (!user?.propertyId) return;

      if (!user?.propertyId) return;

      const { data } = await supabase
        .from('reservations')
        .select(`
          id, check_in, check_out, status,
          guests (first_name, last_name),
          rooms (number)
        `)
        .eq('property_id', user.propertyId)
        .eq('status', 'Checked In');

      if (data) {
        const warnings = data.map((res: any) => {
          const checkIn = new Date(res.check_in);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - checkIn.getTime());
          const daysStayed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysStayed >= 25) {
            return {
              id: res.id,
              guestName: res.guests ? `${res.guests.first_name} ${res.guests.last_name}` : 'Unknown',
              roomNumber: res.rooms ? res.rooms.number : 'N/A',
              daysStayed,
              status: daysStayed >= 28 ? 'Critical' : 'Warning'
            };
          }
          return null;
        }).filter(Boolean);
        setTenancyAlerts(warnings);
      }
    };

    fetchTenancyRisks();
  }, [user?.propertyId]);

  React.useEffect(() => {
    const fetchInsights = async () => {
      // Only fetch if we have a property ID
      if (!user?.propertyId) return;

      try {
        setLoadingInsights(true);
        if (!session?.access_token) return;
        const { getPropertyInsights } = await import('../services/aiService');
        const data = await getPropertyInsights(user.propertyId, session.access_token);
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
  }, [user?.propertyId, session?.access_token]);

  // Data Fetching
  const [statsData, setStatsData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user?.propertyId || !session?.access_token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/dashboard-stats?property_id=${user.propertyId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setStatsData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    // Initial fetch
    fetchStats();

    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user?.propertyId, session?.access_token]);

  // Determine Display Data
  const chartData = statsData?.chartData || [];

  const stats = {
    revenue: `$${statsData?.stats?.revenue?.toLocaleString() || '0'}`,
    revenueSub: "Total Revenue",
    occupancy: `${statsData?.stats?.occupancy || 0}%`,
    occupancySub: "Current Occupancy",
    checkins: `${statsData?.stats?.checkins || 0}`,
    checkinsSub: "Arrivals Today",
    cleaning: `${statsData?.stats?.cleaning || 0}`,
    cleaningSub: "Active Tasks"
  };

  // Maintenance Feed State
  const [maintenanceFeed, setMaintenanceFeed] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchFeed = async () => {
      if (!user?.propertyId) return;
      const { data } = await supabase
        .from('maintenance')
        .select('*, rooms(number)')
        .eq('property_id', user.propertyId)
        .order('updated_at', { ascending: false }) // Show most recently updated first
        .limit(10);
      setMaintenanceFeed(data || []);
    };

    fetchFeed();

    // Subscribe to ALL changes (INSERT, UPDATE)
    const channel = supabase
      .channel('dashboard-maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance', filter: `property_id=eq.${user?.propertyId}` },
        () => fetchFeed() // Simple re-fetch to ensure relations (rooms) are loaded
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.propertyId]);

  return (
    <div className="space-y-6 relative min-h-screen pb-12">
      {/* Background Orbs & Gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 z-[-1] pointer-events-none" />
      <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gold-400 opacity-[0.15] rounded-full blur-[120px] pointer-events-none animate-pulse-subtle" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400 opacity-10 rounded-full blur-[100px] pointer-events-none animate-pulse-subtle" style={{ animationDelay: '1.5s' }} />

      {/* Tenancy Risk Alerts */}
      {tenancyAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse-slow">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900">Tenancy Risk Alert</h3>
              <p className="text-sm text-red-700 mb-3">
                The following guests are approaching or have exceeded the 28-day stay limit.
                Immediate action required to prevent tenancy establishment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tenancyAlerts.map((alert: any) => (
                  <div key={alert.id} className="bg-white p-3 rounded border border-red-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{alert.guestName} <span className="text-slate-500 font-normal">(Rm {alert.roomNumber})</span></p>
                      <p className="text-xs text-red-600 font-medium">Day {alert.daysStayed} of Stay</p>
                    </div>
                    <Badge color={alert.status === 'Critical' ? 'red' : 'yellow'}>
                      {alert.status === 'Critical' ? 'LIMIT REACHED' : 'Risk'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Intel Card */}
      {aiEnabled ? (
          <AIInsightCard
            title={aiInsights?.title}
            subtitle={aiInsights?.subtitle}
            message={aiInsights?.message}
            actionLabel={aiInsights?.actionLabel}
            variant={aiInsights?.variant || 'default'}
            loading={loadingInsights}
            error={aiInsights?.error}
            timestamp={aiInsights?.generatedAt}
            onAction={() => {
              const query = encodeURIComponent(`How to fix ${aiInsights?.message || 'hotel maintenance issue'}`);
              window.open(`https://www.google.com/search?q=${query}`, '_blank');
            }}
          />
      ) : (
          <SaaSMiniLock featureName="Operational AI" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard delay={0.1} title="Total Revenue" value={stats.revenue} sub={stats.revenueSub} icon={DollarSign} color="bg-emerald-500 text-emerald-600" />
        <StatCard delay={0.2} title="Occupancy Rate" value={stats.occupancy} sub={stats.occupancySub} icon={TrendingUp} color="bg-blue-500 text-blue-600" />
        <StatCard delay={0.3} title="Check-Ins Today" value={stats.checkins} sub={stats.checkinsSub} icon={Users} color="bg-gold-500 text-gold-600" />
        <StatCard delay={0.4} title="Rooms Cleaning" value={stats.cleaning} sub={stats.cleaningSub} icon={BedDouble} color="bg-rose-500 text-rose-600" />
      </div>

      {/* Feature Updates Announcement Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gold-500/20 p-2 rounded-lg text-gold-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">New Features & Updates</h2>
          </div>
          <p className="text-slate-300 mb-6 max-w-2xl text-sm leading-relaxed">
            Cardea is constantly evolving. Here are the latest tools and improvements rolled out to help you manage the property more efficiently.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-slate-100">Integrated Payments</h3>
              </div>
              <p className="text-xs text-slate-400">Record secure Stripe card payments or manual cash/check transactions directly from the Reservations list with the new Gold "Payment" button.</p>
            </div>

            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-slate-100">Room Guest History</h3>
              </div>
              <p className="text-xs text-slate-400">Check past guests instantly! Clicking any vacant room in Housekeeping now shows a history of the last 5 guests who stayed there.</p>
            </div>

            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-100">Staff Kiosk & PINs</h3>
              </div>
              <p className="text-xs text-slate-400">All staff PINs have been reset. You can now securely log into the Kiosk, clock in/out, and change your secure PIN while your shift is active.</p>
            </div>

            <div className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 p-4 rounded-xl transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-slate-100">Performance Analytics</h3>
              </div>
              <p className="text-xs text-slate-400">Enhanced backend queries and real-time dashboard updates allow for faster loading of the weekly revenue and occupancy trends.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly Revenue Overview">
          <div className="h-[400px] w-full">
            {/* Recharts ResponsiveContainer needs explicit dimensions if parent flex/grid is unstable */}
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
          <div className="h-[400px] w-full">
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

        <Card title="Live Maintenance Feed" className="h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {maintenanceFeed.length > 0 ? (
              maintenanceFeed.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-100 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${t.status === 'Resolved' ? 'bg-emerald-500' :
                    t.status === 'In Progress' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Room {t.rooms?.number}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {t.category || 'Maintenance'}
                        </span>
                      </p>
                      <Badge color={
                        t.status === 'Resolved' ? 'green' :
                          t.status === 'In Progress' ? 'yellow' :
                            'red'
                      }>{t.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {t.ai_summary || t.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Priority: {t.priority}</span>
                      <span>{new Date(t.updated_at || t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;