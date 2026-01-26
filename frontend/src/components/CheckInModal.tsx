import React, { useState } from 'react';
import { Modal, Button } from './UIComponents';
import { supabase } from '../lib/supabase';
import { Upload, Check, AlertCircle, FileText } from 'lucide-react';
import { Reservation } from '../types';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservation: Reservation | null;
    onConfirm: (reservationId: string) => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, reservation, onConfirm }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Create preview if it's an image
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleConfirm = async () => {
        if (!reservation) return;

        if (file) {
            setUploading(true);
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${reservation.guestId}/ID_${reservation.id}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('guest_documents')
                    .upload(fileName, file, {
                        contentType: file.type,
                        upsert: true
                    });

                if (uploadError) {
                    console.error("ID Upload Error:", uploadError);
                    alert("Failed to upload ID, but proceeding with check-in.");
                    // Optional: return here if we want to BLOCK check-in on failure
                } else {
                    console.log("ID Uploaded successfully");
                }
            } catch (error) {
                console.error("Error in ID upload:", error);
            } finally {
                setUploading(false);
            }
        }

        onConfirm(reservation.id);
        resetState();
    };

    const resetState = () => {
        setFile(null);
        setPreviewUrl(null);
        setUploading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={resetState} title="Check-in Requirements">
            <div className="space-y-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm">ID Verification Required</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Government-issued identification is required for all guests check-in. Please inspect and upload a copy.
                        </p>
                    </div>
                </div>

                {reservation && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-medium mb-1">Checking in</p>
                        <p className="font-bold text-slate-900">{reservation.guestName}</p>
                        <p className="text-sm text-slate-600">ID: {reservation.friendlyId || reservation.id}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Upload ID Document</label>

                    {!file ? (
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <Upload className="w-8 h-8 text-slate-400" />
                                <span className="text-sm font-medium">Click to upload or drag & drop</span>
                                <span className="text-xs text-slate-400">Supports JPG, PNG, PDF</span>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-white relative">
                            {previewUrl ? (
                                <img src={previewUrl} alt="ID Preview" className="w-16 h-10 object-cover rounded bg-slate-100 border border-slate-200" />
                            ) : (
                                <div className="w-16 h-10 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="text-slate-400 hover:text-red-500 p-2"
                            >
                                <AlertCircle className="w-5 h-5 rotate-45" /> {/* Close icon substitute */}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={resetState}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={uploading}
                        icon={uploading ? undefined : Check}
                    >
                        {uploading ? 'Uploading...' : file ? 'Upload & Check In' : 'Skip Upload & Check In'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CheckInModal;
