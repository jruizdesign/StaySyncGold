import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Select, Modal } from '../components/UIComponents';
import { Users, MessageSquare, Ban, FileText, Plus, Receipt, Loader, Edit, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Guest, Invoice } from '../types';

const Guests: React.FC = () => {
    const { user } = useAuth();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'profile' | 'billing' | 'documents'>('profile');
    const [showAIChat, setShowAIChat] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Documents State
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = async () => {
        if (!selectedGuest) return;

        const { data, error } = await supabase.storage
            .from('guest_documents')
            .list(selectedGuest.id);

        if (data) {
            // Get public URLs (or signed URLs if private)
            const docsWithUrls = data.map(file => {
                const { data: urlData } = supabase.storage
                    .from('guest_documents')
                    .getPublicUrl(`${selectedGuest.id}/${file.name}`);
                return { ...file, url: urlData.publicUrl };
            });
            setDocuments(docsWithUrls);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !selectedGuest) return;

        const file = event.target.files[0];
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${selectedGuest.id}/${fileName}`; // Folder by Guest ID

            const { error: uploadError } = await supabase.storage
                .from('guest_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            await fetchDocuments();
            alert('Document uploaded successfully!');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Effect to fetch documents when tab changes
    useEffect(() => {
        if (selectedGuest && activeSubTab === 'documents') {
            fetchDocuments();
        }
    }, [selectedGuest, activeSubTab]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        notes: '',
        vip_status: false,
        do_not_rent: false
    });

    // Invoice State
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        amount: 0,
        description: '',
        dueDate: new Date().toISOString().split('T')[0]
    });

    // ... (fetchGuests remains same)

    const fetchInvoices = async (guestId: string) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('guest_id', guestId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setInvoices(data.map((inv: any) => ({
                    id: inv.id,
                    guestId: inv.guest_id,
                    propertyId: inv.property_id,
                    amount: inv.amount,
                    status: inv.status,
                    dueDate: inv.due_date,
                    createdAt: inv.created_at,
                    items: inv.items || []
                })));
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    useEffect(() => {
        if (selectedGuest && activeSubTab === 'billing') {
            fetchInvoices(selectedGuest.id);
        }
    }, [selectedGuest, activeSubTab]);

    const handleGenerateInvoice = async () => {
        if (!selectedGuest || !user?.propertyId) return;

        try {
            const newItem = { description: invoiceForm.description || 'Accommodation Charges', amount: invoiceForm.amount };

            const { error } = await supabase.from('invoices').insert([{
                guest_id: selectedGuest.id,
                property_id: user.propertyId,
                amount: invoiceForm.amount,
                status: 'Pending',
                due_date: invoiceForm.dueDate,
                items: [newItem]
            }]);

            if (error) throw error;

            alert('Invoice generated successfully!');
            setInvoiceModalOpen(false);
            fetchInvoices(selectedGuest.id);
        } catch (error: any) {
            console.error('Error generating invoice:', error);
            alert(`Failed to generate invoice: ${error.message}`);
        }
    };

    // ... (rest of the component)

    // ... (Inside the 'billing' tab check)



    useEffect(() => {
        if (user) {
            fetchGuests();
        }
    }, [user]);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            let query = supabase.from('guests').select('*');

            if (user?.propertyId) {
                query = query.eq('property_id', user.propertyId);
            } else if (!user?.isAdmin) {
                setGuests([]);
                setLoading(false);
                return;
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const mappedGuests: Guest[] = data.map((g: any) => ({
                    id: g.id,
                    fullName: `${g.first_name} ${g.last_name}`,
                    email: g.email || '',
                    phone: g.phone || '',
                    vipStatus: g.vip_status || false,
                    notes: g.notes || '',
                    lastStay: g.last_stay,
                    doNotRent: g.do_not_rent || false,
                    propertyId: g.property_id
                }));
                // Sort by name
                mappedGuests.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setGuests(mappedGuests);

                // Update selected guest if it exists to keep data fresh
                if (selectedGuest) {
                    const updated = mappedGuests.find(g => g.id === selectedGuest.id);
                    if (updated) setSelectedGuest(updated);
                }
            }
        } catch (error) {
            console.error('Error fetching guests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            notes: '',
            vip_status: false,
            do_not_rent: false
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = () => {
        if (!selectedGuest) return;
        setModalMode('edit');
        // Split full name back to first/last roughly
        const nameParts = selectedGuest.fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData({
            first_name: firstName,
            last_name: lastName,
            email: selectedGuest.email,
            phone: selectedGuest.phone,
            notes: selectedGuest.notes,
            vip_status: selectedGuest.vipStatus,
            do_not_rent: selectedGuest.doNotRent || false
        });
        setIsModalOpen(true);
    };

    const handleSaveGuest = async () => {
        // Validation: Ensure Global Admins match context
        const contextPropertyId = user?.propertyId;

        // If 'add' mode, we NEED a property ID. 
        // If 'edit' mode, we use the guest's existing property ID unless admin sets a new one (not implemented yet).

        let targetPropertyId = contextPropertyId;

        if (modalMode === 'edit' && selectedGuest) {
            targetPropertyId = selectedGuest.propertyId;
        }

        if (!targetPropertyId && !user?.isAdmin) {
            // Should verify: Can a non-admin exist without propertyId? Ideally no.
            alert("Error: Missing Property Context.");
            return;
        }

        // Deep Guard: If still no ID (e.g. Super Admin adding guest without selecting property context)
        if (!targetPropertyId && modalMode === 'add') {
            alert("Cannot create guest. valid Property ID required.");
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                notes: formData.notes,
                vip_status: formData.vip_status,
                do_not_rent: formData.do_not_rent
            };

            // Only add property_id if creating new
            if (modalMode === 'add') {
                payload.property_id = targetPropertyId;
            }

            let error;
            if (modalMode === 'add') {
                const { error: insertError } = await supabase.from('guests').insert([payload]);
                error = insertError;
            } else {
                const { error: updateError } = await supabase
                    .from('guests')
                    .update(payload)
                    .eq('id', selectedGuest!.id);
                error = updateError;
            }

            if (error) throw error;

            setIsModalOpen(false);
            await fetchGuests(); // Refresh list
            alert(modalMode === 'add' ? 'Guest added successfully!' : 'Guest updated successfully!');

        } catch (err: any) {
            console.error('Error saving guest:', err);
            alert(`Failed to save guest: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredGuests = guests.filter(g =>
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.includes(searchTerm)
    );

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-gold-500" /></div>;
    }

    if (!user?.propertyId && !user?.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <p>You are not assigned to any property.</p>
                <p className="text-sm">Please contact your administrator.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Guest CRM</h1>
                <Button icon={Plus} onClick={handleOpenAdd}>Add New Guest</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1" title="Guest Directory">
                    <div className="space-y-3">
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                            {filteredGuests.map(guest => (
                                <div
                                    key={guest.id}
                                    onClick={() => setSelectedGuest(guest)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedGuest?.id === guest.id ? 'border-gold-500 bg-gold-50' : 'border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className={`font-semibold transition-colors ${selectedGuest?.id === guest.id ? 'text-gold-900' : 'text-slate-900'}`}>{guest.fullName}</p>
                                        <div className="flex gap-1">{guest.vipStatus && <Badge color="yellow">VIP</Badge>} {guest.doNotRent && <Badge color="red">DNR</Badge>}</div>
                                    </div>
                                    <p className={`text-xs transition-colors ${selectedGuest?.id === guest.id ? 'text-gold-600' : 'text-slate-500'}`}>{guest.email}</p>
                                </div>
                            ))}
                            {filteredGuests.length === 0 && (
                                <p className="text-center text-slate-400 py-4">No guests found.</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2 overflow-hidden" title={selectedGuest ? `Guest: ${selectedGuest.fullName}` : 'Select a Guest'}>
                    {selectedGuest ? (
                        <div className="space-y-6">
                            <div className="flex border-b border-slate-100">
                                <button onClick={() => setActiveSubTab('profile')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'profile' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-500'}`}>Profile & Notes</button>
                                <button onClick={() => setActiveSubTab('billing')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'billing' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-500'}`}>Billing & Invoices</button>
                                <button onClick={() => setActiveSubTab('documents')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'documents' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-500'}`}>Documents</button>
                            </div>

                            {activeSubTab === 'profile' && (
                                showAIChat ? (
                                    <div className="space-y-4 animate-slideIn">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-gold-600 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> AI Messaging Center</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setShowAIChat(false)}>Back to Profile</Button>
                                        </div>
                                        <div className="h-80 bg-slate-50/50 rounded-2xl p-6 overflow-y-auto border border-slate-100 space-y-4">
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%] text-sm leading-relaxed text-slate-700">
                                                Hello! I am your AI assistant. I can help you draft personalized welcome messages or handle guest inquiries for {selectedGuest.fullName}.
                                            </div>
                                            <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[85%] ml-auto text-sm leading-relaxed">
                                                Draft a checkout reminder for tomorrow morning.
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%] text-sm border-l-4 border-gold-500 leading-relaxed text-slate-700">
                                                "Dear {selectedGuest.fullName.split(' ')[0]}, we hope you enjoyed your stay! Just a friendly reminder that checkout is at 11:00 AM tomorrow. Safe travels!"
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input placeholder="Ask AI to draft a message..." className="flex-1" />
                                            <Button icon={Send}>Send</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input label="Email" value={selectedGuest.email} readOnly disabled className="bg-slate-50" />
                                                    <Input label="Phone" value={selectedGuest.phone} readOnly disabled className="bg-slate-50" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                                                    <div className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 min-h-[100px] whitespace-pre-wrap">
                                                        {selectedGuest.notes || <span className="text-slate-400 italic">No notes added.</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-48 space-y-4">
                                                {selectedGuest.vipStatus && (
                                                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
                                                        <span className="text-sm font-bold text-yellow-800">VIP Guest</span>
                                                    </div>
                                                )}
                                                <div className={`p-4 border rounded-lg ${selectedGuest.doNotRent ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                    <div className={`flex items-center gap-2 mb-2 ${selectedGuest.doNotRent ? 'text-red-700' : 'text-slate-500'}`}>
                                                        <Ban className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase">Restriction</span>
                                                    </div>
                                                    <span className={`text-sm font-bold ${selectedGuest.doNotRent ? 'text-red-900' : 'text-slate-400'}`}>
                                                        {selectedGuest.doNotRent ? 'DO NOT RENT' : 'No Restrictions'}
                                                    </span>
                                                </div>
                                                <Button variant="outline" icon={MessageSquare} className="w-full" onClick={() => setShowAIChat(true)}>AI Messaging</Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button icon={Edit} onClick={handleOpenEdit}>Edit Profile</Button>
                                        </div>
                                    </div>
                                )
                            )}

                            {activeSubTab === 'billing' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800">Invoice History</h4>
                                        <Button size="sm" icon={Plus} onClick={() => setInvoiceModalOpen(true)}>Generate Invoice</Button>
                                    </div>

                                    {invoices.length > 0 ? (
                                        <div className="space-y-3">
                                            {invoices.map(inv => (
                                                <div key={inv.id} className="bg-white border border-slate-100 p-4 rounded-lg flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-800">${inv.amount.toFixed(2)}</p>
                                                            <Badge color={inv.status === 'Paid' ? 'green' : inv.status === 'Pending' ? 'yellow' : 'red'}>{inv.status}</Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                                                        <p className="text-xs text-slate-400 mt-1">{inv.items.map(i => i.description).join(', ')}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" icon={Receipt}>View</Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">No invoices generated.</p>
                                    )}
                                </div>

                            )}
                            {activeSubTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800">Documents</h4>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <label htmlFor="file-upload">
                                                <Button size="sm" icon={Plus} as="span" className="cursor-pointer">
                                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                                </Button>
                                            </label>
                                        </div>
                                    </div>

                                    {documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {documents.map((doc: any, i: number) => (
                                                <div key={i} className="bg-white border border-slate-100 p-3 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded flex items-center justify-center">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium text-slate-800 text-sm truncate w-40" title={doc.name}>{doc.name}</p>
                                                            <p className="text-xs text-slate-400">{(doc.metadata?.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" icon={Receipt} onClick={() => window.open(doc.url, '_blank')}>View</Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-lg">
                                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm">No documents uploaded.</p>
                                            <p className="text-xs text-slate-300">IDs, Contracts, Waivers</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Users className="w-16 h-16 mb-4 opacity-10" />
                            <p>Select a guest to manage their profile and billing</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'add' ? 'Add New Guest' : 'Edit Guest Profile'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={formData.first_name}
                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        />
                        <Input
                            label="Last Name"
                            value={formData.last_name}
                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none"
                            rows={4}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.vip_status}
                                onChange={e => setFormData({ ...formData, vip_status: e.target.checked })}
                                className="w-4 h-4 text-gold-600 rounded focus:ring-gold-500"
                            />
                            <span className="text-sm font-medium text-slate-700">VIP Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.do_not_rent}
                                onChange={e => setFormData({ ...formData, do_not_rent: e.target.checked })}
                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-red-700">Do Not Rent</span>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveGuest}>
                            {modalMode === 'add' ? 'Create Guest' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Invoice Modal */}
            <Modal
                isOpen={invoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                title="Generate New Invoice"
            >
                <div className="space-y-4">
                    <Input
                        label="Amount ($)"
                        type="number"
                        value={invoiceForm.amount}
                        onChange={e => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) })}
                    />
                    <Input
                        label="Description"
                        value={invoiceForm.description}
                        onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                        placeholder="e.g. Room Charges, Room Service, etc."
                    />
                    <Input
                        label="Due Date"
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateInvoice}>Create Invoice</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Guests;