import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Percent } from 'lucide-react';
import { AccountingStat } from '../../types/accounting';

interface MetricCardProps {
    stat: AccountingStat;
}

export const MetricCard: React.FC<MetricCardProps> = ({ stat }) => {
    const isPositive = (stat.trend || 0) >= 0;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className={`p-2 rounded-lg ${stat.color || 'bg-slate-100 text-slate-600'}`}>
                    {stat.type === 'currency' ? <DollarSign size={16} /> : <Percent size={16} />}
                </div>
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                        {stat.type === 'currency' ? '$' : ''}
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        {stat.type === 'percent' ? '%' : ''}
                    </h3>

                    {stat.trend !== undefined && (
                        <div className={`flex items-center mt-1 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span>{Math.abs(stat.trend)}% vs last month</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
