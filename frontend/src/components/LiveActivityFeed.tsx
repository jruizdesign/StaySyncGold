import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Log {
    id: string;
    message: string;
    created_at: string;
    level: string;
}

export const LiveActivityFeed: React.FC = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Log[]>([]);

    useEffect(() => {
        if (!user) return;

        fetchRecentActivity();

        const channel = supabase
            .channel('sidebar-activity')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_logs',
                    filter: user.propertyId ? `property_id=eq.${user.propertyId}` : undefined
                },
                (payload) => {
                    setActivities((prev) => [payload.new as Log, ...prev].slice(0, 5));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchRecentActivity = async () => {
        let query = supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (user?.propertyId) {
            query = query.eq('property_id', user.propertyId);
        }

        const { data } = await query;
        if (data) setActivities(data);
    };

    if (activities.length === 0) {
        return <p className="text-slate-400 text-sm text-center py-4">No recent system activity.</p>;
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-500';
            case 'ERROR': return 'bg-orange-500';
            case 'WARNING': return 'bg-yellow-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="space-y-0 divide-y divide-slate-100">
            {activities.map((log) => (
                <div key={log.id} className="text-sm animate-fadeIn relative pl-4 py-3 first:pt-0 last:pb-0">
                    <div className={`absolute left-0 top-4 w-2 h-2 rounded-full ${getLevelColor(log.level)}`} />
                    <p className="text-slate-700 leading-relaxed font-medium">
                        {log.message}
                    </p>
                    <p className="text-slate-400 mt-1 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
};