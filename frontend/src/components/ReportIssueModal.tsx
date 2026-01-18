import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { logger } from '../lib/logger';

interface ReportIssueModalProps {
    roomNumber: string;
    roomId: string;
    onClose: () => void;
    onSubmit: (issue: any) => void;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ roomNumber, roomId, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [description, setDescription] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!description.trim()) return;
        setAnalyzing(true);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_BASE}/ai/analyze-issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });
            const data = await res.json();
            setAnalysis(data);
            setStep(2);
        } catch (error) {
            console.error('Analysis failed', error);
            // Fallback to manual entry if AI fails
            onSubmit({
                description,
                severity: 'Medium',
                category: 'Other',
                suggested_action: 'Investigate'
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirm = () => {
        onSubmit({
            description, // Keep original user description
            ai_summary: analysis.summary,
            severity: analysis.severity,
            category: analysis.category,
            suggested_action: analysis.suggested_action
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Report Issue - Room {roomNumber}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Describe the issue</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., The sink in the bathroom is draining very slowly and making a gurgling noise."
                                    className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-700"
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm">
                                <Info className="w-5 h-5 shrink-0" />
                                <p>StaySync AI will analyze your report to determine severity and categorize it automatically for the maintenance team.</p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4 animate-slideIn">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Analysis Complete</h4>
                                    <p className="text-sm text-slate-500">Categorized as <span className="font-medium text-slate-900">{analysis.category}</span></p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Severity</span>
                                    <div className={`mt-1 text-lg font-black ${analysis.severity === 'Critical' ? 'text-red-600' :
                                            analysis.severity === 'High' ? 'text-orange-600' :
                                                'text-blue-600'
                                        }`}>
                                        {analysis.severity.toUpperCase()}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</span>
                                    <p className="mt-1 text-slate-700 font-medium">{analysis.summary}</p>
                                </div>

                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Action</span>
                                    <p className="mt-1 text-slate-700">{analysis.suggested_action}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</button>

                    {step === 1 ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={!description.trim() || analyzing}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {analyzing ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Sparkles className="w-4 h-4" />}
                            Analyze & Report
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep(1)}
                            className="mr-auto text-sm text-slate-500 hover:text-slate-700 font-medium"
                        >
                            Back
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={handleConfirm}
                            className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            Confirm & Submit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportIssueModal;
