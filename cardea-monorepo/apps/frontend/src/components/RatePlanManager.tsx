import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Badge } from './UIComponents';
import { Plus, Trash2, Tag, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';

interface RatePlan {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    // derivation_rule?: any; // For future use
}

interface RatePlanManagerProps {
    propertyId: string;
    onPlanChange: () => void; // Callback to refresh parent components
}

const PRESETS = [
    {
        name: "Non-Refundable",
        description: "10% cheaper, no refunds allowed.",
        derivation: { type: 'percent', value: -10, base: 'Standard Plan' }
    },
    {
        name: "Weekly Special",
        description: "Stay 7+ nights, get 15% off.",
        derivation: { type: 'percent', value: -15, base: 'Standard Plan' }
    },
    {
        name: "Monthly Stay",
        description: "30+ nights, ideal for digital nomads.",
        derivation: { type: 'percent', value: -30, base: 'Standard Plan' }
    },
    {
        name: "Early Bird",
        description: "Book 30 days in advance.",
        derivation: { type: 'percent', value: -5, base: 'Standard Plan' }
    }
];

const RatePlanManager: React.FC<RatePlanManagerProps> = ({ propertyId, onPlanChange }) => {
    const [plans, setPlans] = useState<RatePlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Plan Form
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');

    useEffect(() => {
        if (propertyId) fetchPlans();
    }, [propertyId]);

    const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rate_plans')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: true });

        if (data) setPlans(data);
        if (error) console.error("Error fetching plans:", error);
        setLoading(false);
    };

    const handleCreatePlan = async (name: string, description: string, rule: any = null) => {
        if (!name) return;

        const { error, data } = await supabase.from('rate_plans').insert({
            property_id: propertyId,
            name,
            description,
            is_active: true,
            derivation_rule: rule
        }).select().single();

        if (error) {
            alert("Failed to create plan: " + error.message);
        } else {
            // Trigger calculation if a rule exists
            if (rule) {
                // Call backend to apply rule? Or do it client side?
                // Client side reuse of applyBulkUpdate logic is tricky because it's in another component.
                // Ideal: Backend endpoint /api/rates/apply-rule
                try {
                    await fetch(`${API_BASE_URL}/api/rates/apply-rule`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            propertyId,
                            ratePlanId: data.id,
                            rule
                        })
                    });
                } catch (e) {
                    console.error("Failed to apply initial rule", e);
                }
            }

            fetchPlans();
            onPlanChange();
            setIsModalOpen(false);
            setNewPlanName('');
            setNewPlanDesc('');
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!window.confirm("Are you sure? This will delete all rates associated with this plan.")) return;

        const { error } = await supabase.from('rate_plans').delete().eq('id', id);
        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            fetchPlans();
            onPlanChange();
        }
    };

    return (
        <Card title="Rate Plans" className="h-full">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">
                    Manage different pricing strategies. "Standard Rate" is your base.
                    Create additional plans for different policies or promotions.
                </p>

                <div className="space-y-2">
                    {plans.map(plan => (
                        <div key={plan.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gold-500" />
                                    {plan.name}
                                    {plan.name.includes('Standard') && <Badge color="blue">Base</Badge>}
                                </h4>
                                <p className="text-xs text-slate-500">{plan.description || "No description"}</p>
                            </div>
                            {!plan.name.includes('Standard') && (
                                <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Plan"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {plans.length === 0 && !loading && (
                        <div className="text-center p-4 text-slate-400 text-sm">No plans found.</div>
                    )}
                </div>

                <Button icon={Plus} onClick={() => setIsModalOpen(true)} className="w-full">Create New Plan</Button>

                {/* Create Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Rate Plan">
                    <div className="space-y-6">

                        {/* Custom Plan Form */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-700 mb-2">Custom Plan</h4>
                            <div className="space-y-3">
                                <Input
                                    label="Plan Name"
                                    placeholder="e.g. VIP Special"
                                    value={newPlanName}
                                    onChange={(e) => setNewPlanName(e.target.value)}
                                />
                                <Input
                                    label="Description"
                                    placeholder="Internal note"
                                    value={newPlanDesc}
                                    onChange={(e) => setNewPlanDesc(e.target.value)}
                                />
                                <div className="flex justify-end pt-2">
                                    <Button onClick={() => handleCreatePlan(newPlanName, newPlanDesc, null)} disabled={!newPlanName}>
                                        Create Custom
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Or Select a Preset</span>
                            </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => handleCreatePlan(preset.name, preset.description, preset.derivation)}
                                    className="flex flex-col items-start p-3 bg-white border border-slate-200 rounded-lg hover:border-gold-500 hover:bg-gold-50 hover:shadow-sm transition-all text-left group"
                                >
                                    <div className="flex justify-between w-full">
                                        <span className="font-bold text-slate-800 group-hover:text-gold-700">{preset.name}</span>
                                        <Copy className="w-4 h-4 text-slate-300 group-hover:text-gold-500" />
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">{preset.description}</span>
                                </button>
                            ))}
                        </div>

                    </div>
                </Modal>
            </div>
        </Card>
    );
};

export default RatePlanManager;
