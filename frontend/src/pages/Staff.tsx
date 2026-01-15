import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UIComponents';
import { UserPlus, Calendar, Clock, MoreHorizontal, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Staff: React.FC = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const fetchStaff = async () => {
    setLoading(true);
    if (!user?.propertyId) {
      setStaffList([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('property_id', user.propertyId);

    if (error) {
      console.error('Error fetching staff:', error);
    } else {
      setStaffList(data || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" icon={Calendar}>View Schedule</Button>
          <Button icon={UserPlus}>Add Employee</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-2 space-y-4">
          {staffList.map((staff) => (
            <Card key={staff.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
                    {(staff.firstname || staff.name || '?').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{staff.firstname} {staff.last_name}</h3>
                    <p className="text-sm text-slate-500">{staff.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">Status</div>
                    <Badge color="green">Active</Badge>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {staffList.length === 0 && (
            <div className="text-center p-8 text-slate-500 italic bg-white rounded-lg border border-slate-200">
              No staff members found for this property.
            </div>
          )}
        </div>

        {/* Quick Schedule Overview */}
        <div className="space-y-6">
          <Card title="Today's Shift Coverage">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Front Desk</span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs">JD</div>
                    <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs">AS</div>
                  </div>
                  <span className="text-xs text-slate-500">2/2</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Housekeeping</span>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs">T8</div>
                  </div>
                  <span className="text-xs text-red-500 font-medium">1/3 (Short)</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Next shift change in 2h 15m</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Staff;