import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Card, Button, Badge } from '../components/UIComponents';
import { User, DollarSign, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface OverviewItem {
    reservation_id: string;
    guest_name: string;
    room_number: string;
    check_in: string;
    amount_paid: number;
    amount_owed: number;
    total_price: number;
    days_behind: number;
    status: string;
}

const DailyOverview: React.FC = () => {
    const { user, session } = useAuth();
    const [data, setData] = useState<OverviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.propertyId && session?.access_token) {
            fetchData();
        }
    }, [user, session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!session?.access_token) {
                console.error("No access token available");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/overview/daily-overview?property_id=${user?.propertyId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to fetch daily overview (${res.status})`);
            }

            const result = await res.json();
            setData(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Daily Overview...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Daily Overview</h1>
                    <p className="text-slate-500 mt-1">Checked-in guests and payment status</p>
                </div>
                <Button onClick={fetchData} variant="outline">Refresh</Button>
            </div>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                                <th className="px-6 py-4 font-semibold">Guest</th>
                                <th className="px-6 py-4 font-semibold">Room</th>
                                <th className="px-6 py-4 font-semibold">Check-in</th>
                                <th className="px-6 py-4 font-semibold text-right">Total Price</th>
                                <th className="px-6 py-4 font-semibold text-right">Paid</th>
                                <th className="px-6 py-4 font-semibold text-right">Owed</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No checked-in guests found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.reservation_id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                    <User size={16} />
                                                </div>
                                                <span className="font-medium text-slate-900">{item.guest_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            Room {item.room_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(item.check_in).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                                            ${item.total_price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                                            ${item.amount_paid.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-bold ${item.amount_owed > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                    ${item.amount_owed.toFixed(2)}
                                                </span>
                                                {item.amount_owed > 0 && (
                                                    <span className="text-xs text-red-500 font-medium mt-0.5">
                                                        Owes {((item.amount_owed / item.total_price) * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.days_behind > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                                    <AlertTriangle size={12} />
                                                    {item.days_behind} Day{item.days_behind > 1 ? 's' : ''} Behind
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                                                    <CheckCircle size={12} />
                                                    On Track
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DailyOverview;
