import { analyzeIncidentReport } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Info } from 'lucide-react';

interface ReportIssueModalProps {
    roomNumber?: string;
    rooms?: { id: string; number: string }[];
    existingIssue?: any;
    onClose: () => void;
    onSubmit: (issue: any) => void;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ roomNumber, rooms, existingIssue, onClose, onSubmit }) => {
    const { session } = useAuth();
    const [step, setStep] = useState(existingIssue ? 2 : 1);
    const [description, setDescription] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(existingIssue ? {
        severity: existingIssue.priority || existingIssue.severity,
        category: existingIssue.category,
        summary: existingIssue.ai_summary,
        suggested_action: existingIssue.suggested_action
    } : null);

    const handleAnalyze = async () => {
        if (!description.trim()) return;
        setAnalyzing(true);
        try {
            if (!session?.access_token) throw new Error("Authentication required for analysis");
            const result = await analyzeIncidentReport(description, session.access_token);
            if (!result) throw new Error("AI Analysis returned null");

            setAnalysis({
                severity: result.severity,
                category: result.category,
                summary: result.summary,
                suggested_action: result.suggestedAction // Note mapping: camelCase vs snake_case
            });
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
        if (existingIssue) {
            onClose();
            return;
        }
        
        const submissionPayload: any = {
            description, // Keep original user description
            ai_summary: analysis.summary,
            severity: analysis.severity,
            category: analysis.category,
            suggested_action: analysis.suggested_action
        };
        
        if (!roomNumber && selectedRoomId) {
            submissionPayload.room_id = selectedRoomId;
        }
        
        onSubmit(submissionPayload);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all scale-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold text-slate-800">
                        {existingIssue ? 'Issue Details' : 'Report Issue'} 
                        {roomNumber && <span className="text-slate-400 font-medium ml-1">- Room {roomNumber}</span>}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 bg-slate-50/30">
                    {step === 1 ? (
                        <>
                            {!roomNumber && rooms && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Room</label>
                                    <select
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-700 font-medium bg-white"
                                        value={selectedRoomId}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>-- Select a Room --</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>Room {r.number}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Describe the issue</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., The sink in the bathroom is draining very slowly and making a gurgling noise."
                                    className="w-full h-40 px-5 py-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none text-slate-700 text-base shadow-sm bg-white placeholder:text-slate-400"
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm border border-blue-100/50 items-start">
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="leading-snug">Cardea AI will analyze your report to instantly determine severity, categorize the problem, and suggest immediate actions for the maintenance team.</p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-5 animate-slideIn">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${existingIssue ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                                    {existingIssue ? <Info className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{existingIssue ? 'Issue Report' : 'Analysis Complete'}</h4>
                                    <p className="text-slate-500">Categorized as <span className="font-bold text-slate-800 bg-slate-200/50 px-2 py-0.5 rounded text-sm uppercase tracking-wide ml-1">{analysis.category}</span></p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Severity Level</span>
                                    <div className={`text-2xl font-black tracking-tight ${analysis.severity === 'Critical' ? 'text-red-600' :
                                        analysis.severity === 'High' ? 'text-orange-500' :
                                            analysis.severity === 'Medium' ? 'text-amber-500' :
                                                'text-blue-500'
                                        }`}>
                                        {analysis.severity?.toUpperCase() || 'UNKNOWN'}
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">AI Summary</span>
                                    <p className="text-slate-700 font-medium leading-relaxed">{analysis.summary}</p>
                                </div>

                                <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Suggested Action</span>
                                    <p className="text-slate-700 leading-relaxed">{analysis.suggested_action}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-500 hover:text-slate-800 font-semibold transition-colors">
                        {existingIssue ? 'Close' : 'Cancel'}
                    </button>

                    {step === 1 ? (
                        <button
                            onClick={handleAnalyze}
                            disabled={(!roomNumber && !selectedRoomId) || !description.trim() || analyzing}
                            className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5"
                        >
                            {analyzing ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Sparkles className="w-4 h-4 text-purple-300" />}
                            {analyzing ? 'Analyzing...' : 'Analyze Issue'}
                        </button>
                    ) : (
                        !existingIssue && (
                            <>
                                <button
                                    onClick={() => setStep(1)}
                                    className="mr-auto text-sm text-slate-400 hover:text-slate-600 font-medium px-2"
                                >
                                    Back to Edit
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-8 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Confirm & Submit
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportIssueModal;
