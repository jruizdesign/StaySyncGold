import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PropertyTax } from '../types';
import { Card, Button, Input, Badge } from '../components/UIComponents';
import { Plus, Trash2, Edit, Save, X, DollarSign, Percent, User, CalendarDays } from 'lucide-react';

export const TaxesManager: React.FC = () => {
    const { user } = useAuth();
    const [taxes, setTaxes] = useState<PropertyTax[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [enabled, setEnabled] = useState(false);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        type: 'PERCENTAGE',
        is_active: true
    });

    useEffect(() => {
        if (user?.propertyId) fetchSetup();
    }, [user?.propertyId]);

    const fetchSetup = async () => {
        if (!user?.propertyId) return;
        setLoading(true);
        try {
            // Check if feature is enabled
            const { data: propData } = await supabase
                .from('properties')
                .select('enable_tax_engine')
                .eq('id', user.propertyId)
                .single();
                
            setEnabled(propData?.enable_tax_engine || false);

            if (propData?.enable_tax_engine) {
                const { data: taxData, error } = await supabase
                    .from('property_taxes')
                    .select('*')
                    .eq('property_id', user.propertyId)
                    .order('created_at');
                
                if (error) throw error;
                setTaxes(taxData as PropertyTax[]);
            }
        } catch (e: any) {
            console.error("Error fetching taxes", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.propertyId) return;
        setLoading(true);
        setError('');

        const payload = {
            property_id: user.propertyId,
            name: formData.name,
            amount: parseFloat(formData.amount),
            type: formData.type,
            is_active: formData.is_active
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('property_taxes').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('property_taxes').insert([payload]);
                if (error) throw error;
            }
            setShowForm(false);
            fetchSetup();
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this tax rule?")) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('property_taxes').delete().eq('id', id);
            if (error) throw error;
            fetchSetup();
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const openEdit = (tax: PropertyTax) => {
        setFormData({
            name: tax.name,
            amount: tax.amount.toString(),
            type: tax.type,
            is_active: tax.is_active
        });
        setEditingId(tax.id);
        setShowForm(true);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'PERCENTAGE': return <Percent className="w-4 h-4 text-blue-500" />;
            case 'FLAT_PER_NIGHT': return <CalendarDays className="w-4 h-4 text-emerald-500" />;
            case 'FLAT_PER_STAY': return <DollarSign className="w-4 h-4 text-gold-500" />;
            case 'PER_GUEST_PER_NIGHT': return <User className="w-4 h-4 text-purple-500" />;
            default: return null;
        }
    };

    const getTypeLabel = (type: string) => {
        return type.replace(/_/g, ' ').toLowerCase()
                   .replace(/\b\w/g, l => l.toUpperCase());
    };

    if (!enabled) {
        return (
            <Card title="Taxes & Fees Engine">
                <div className="text-center py-12 px-4 rounded-xl relative overflow-hidden bg-slate-50 border border-slate-200">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Advanced Tax Engine Locked</h3>
                    <p className="text-slate-500 max-w-lg mx-auto mb-6">
                        Your property is current using basic standard taxation. Upgrade your plan or contact your administrator to enable dynamic granular tax codes, custom city fees, and per-guest routing.
                    </p>
                    <Button variant="outline" className="border-blue-200 text-blue-700 bg-white">Contact Support to Enable</Button>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Taxes & Fees Configurator" action={
            !showForm && <Button icon={Plus} onClick={() => {
                setFormData({ name: '', amount: '', type: 'PERCENTAGE', is_active: true });
                setEditingId(null);
                setShowForm(true);
            }}>Add Tax Rule</Button>
        }>
            <div className="space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                {showForm && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">{editingId ? 'Edit Rule' : 'New Tax Rule'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Tax Name (e.g., City Occupancy Tax)" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                <Input label="Amount" type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Calculation Type</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FLAT_PER_NIGHT">Flat Rate / Night ($)</option>
                                        <option value="FLAT_PER_STAY">Flat Rate / Stay ($)</option>
                                        <option value="PER_GUEST_PER_NIGHT">Per Guest / Night ($)</option>
                                    </select>
                                </div>
                                <div className="flex items-center mt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">Active across property</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={loading} icon={Save}>{loading ? 'Saving...' : 'Save Rule'}</Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rule Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {taxes.map(tax => (
                                <tr key={tax.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{tax.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(tax.type)}
                                            <span className="text-slate-600">{getTypeLabel(tax.type)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                                        {tax.type === 'PERCENTAGE' ? `${tax.amount}%` : `$${tax.amount.toFixed(2)}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge color={tax.is_active ? "green" : "gray"}>{tax.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(tax)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(tax.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && taxes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No taxes configured. Room rates will be charged flat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};
