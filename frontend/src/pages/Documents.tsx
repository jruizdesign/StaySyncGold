import React from 'react';
import React, { useState } from 'react';
import { Card, Button } from '../components/UIComponents';
import { Image as ImageIcon, FileText, ShieldCheck, Search } from 'lucide-react';
import { Image as ImageIcon, FileText, ShieldCheck, Search, Loader } from 'lucide-react';

const Documents: React.FC = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const handleSimulateUpload = () => {
        setIsUploading(true);
        setUploadStatus('AI is scanning document...');

        setTimeout(() => {
            setUploadStatus('Matching to Guest: Jason Smith...');
            setTimeout(() => {
                setIsUploading(false);
                setUploadStatus('Successfully attached to profile!');
            }, 2000);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Vaulted Document Center</h1>
                    <p className="text-slate-500">Secure AI-powered document processing and storage</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon={Search}>Search Vault</Button>
                    <Button icon={ImageIcon}>Upload Documents</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2" title="AI Processing Queue">
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
                        <div className="mx-auto w-20 h-20 bg-gold-50 rounded-full flex items-center justify-center mb-6">
                            <ImageIcon className="w-10 h-10 text-gold-600" />
                            {isUploading ? <Loader className="w-10 h-10 text-gold-600 animate-spin" /> : <ImageIcon className="w-10 h-10 text-gold-600" />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Drop guest IDs or receipts here</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-3">
                            Our AI will automatically scan the content, extract details, and attach the file to the correct guest profile.
                        </p>
                        <Button className="mt-8" variant="outline" size="lg">Select Files to Upload</Button>
                        <div className="mt-8 space-y-4">
                            <Button variant="outline" size="lg" onClick={handleSimulateUpload} disabled={isUploading}>
                                {isUploading ? 'Processing...' : 'Select Files to Upload'}
                            </Button>
                            {uploadStatus && (
                                <p className="text-sm font-medium text-gold-600 animate-pulse">{uploadStatus}</p>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card title="Vault Security">
                        <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg mb-4">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-medium">All documents are encrypted</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Documents uploaded here are stored in a secure, encrypted bucket. Access is logged and restricted to authorized personnel only.
                        </p>
                    </Card>
                    <Card title="Recent Invoices">
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-700">INV-2024-00{i}.pdf</span>
                                    </div>
                                    <span className="text-xs text-slate-400">2h ago</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Documents;