import React from 'react';
import { Card, Button, Badge } from '../components/UIComponents';
import { MOCK_TRANSACTIONS } from '../constants';
import { Download, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';

const Financials: React.FC = () => {
  const pieData = [
    { name: 'Room Revenue', value: 65, color: '#f59e0b' },
    { name: 'F&B', value: 20, color: '#10b981' },
    { name: 'Services', value: 10, color: '#3b82f6' },
    { name: 'Events', value: 5, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Financial Performance</h2>
        <Button variant="outline" icon={Download}>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Recent Transactions</h3>
              <Button variant="ghost" className="text-sm">View All</Button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="text-slate-500 border-b border-slate-100 bg-slate-50/50">
                 <tr>
                   <th className="pb-3 pl-2 font-medium">Date</th>
                   <th className="pb-3 font-medium">Description</th>
                   <th className="pb-3 font-medium">Category</th>
                   <th className="pb-3 font-medium text-right pr-2">Amount</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {MOCK_TRANSACTIONS.map(t => (
                   <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                     <td className="py-3 pl-2 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                     <td className="py-3 font-medium text-slate-800">{t.description}</td>
                     <td className="py-3">
                       <Badge color="gray">{t.category}</Badge>
                     </td>
                     <td className={`py-3 pr-2 text-right font-bold ${t.type === 'Credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                       {t.type === 'Credit' ? '+' : '-'}${t.amount}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </Card>

         <Card title="Revenue Distribution">
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie
                   data={pieData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <ReTooltip />
                 <Legend />
               </RePieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Projected RevPAR</span>
                <span className="font-bold text-slate-900">$142.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">ADR (Average Daily Rate)</span>
                <span className="font-bold text-slate-900">$185.00</span>
              </div>
           </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <DollarSign className="w-32 h-32" />
           </div>
           <p className="text-slate-400 font-medium mb-1">Total Monthly Revenue</p>
           <h3 className="text-4xl font-bold text-white mb-6">$124,592.00</h3>
           <div className="flex gap-4">
              <div className="bg-slate-800 p-3 rounded-lg flex-1">
                 <p className="text-xs text-slate-400 mb-1">Expenses</p>
                 <p className="text-lg font-bold text-rose-400">$32,100</p>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg flex-1">
                 <p className="text-xs text-slate-400 mb-1">Net Profit</p>
                 <p className="text-lg font-bold text-emerald-400">$92,492</p>
              </div>
           </div>
        </div>

        <div className="bg-gold-500 rounded-xl p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32" />
           </div>
           <p className="text-gold-100 font-medium mb-1">Outstanding Invoices</p>
           <h3 className="text-4xl font-bold text-white mb-6">3</h3>
           <p className="text-sm text-gold-100 mb-4">Total Value: $4,250.00</p>
           <Button className="w-full bg-white text-gold-600 hover:bg-gold-50">View Invoices</Button>
        </div>
      </div>
    </div>
  );
};

export default Financials;