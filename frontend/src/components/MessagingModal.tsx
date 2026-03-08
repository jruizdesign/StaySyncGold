import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Loader, MessageSquare } from 'lucide-react';
import { Modal } from './UIComponents';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export interface Recipient {
    reservation_id: string;
    guest_id: string;
    name: string;
    room_number?: string;
}

interface Message {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    created_at: string;
    sender_name?: string;
}

interface MessagingModalProps {
    isOpen: boolean;
    onClose: () => void;
    presetRecipients?: Recipient[];
}

const MessagingModal: React.FC<MessagingModalProps> = ({ isOpen, onClose, presetRecipients }) => {
    const { user, session } = useAuth();
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [messageContent, setMessageContent] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);

    // For single recipient chat history
    const [history, setHistory] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isBroadcast = !presetRecipients || presetRecipients.length === 0;
    const isSingle = recipients.length === 1;

    useEffect(() => {
        if (isOpen) {
            setMessageContent('');
            if (presetRecipients && presetRecipients.length > 0) {
                setRecipients(presetRecipients);
                if (presetRecipients.length === 1) {
                    fetchHistory(presetRecipients[0].reservation_id);
                } else {
                    setHistory([]);
                }
            } else {
                // Broadcast mode: fetch all active reservations
                fetchAllActiveGuests();
            }
        }
    }, [isOpen, presetRecipients]);

    useEffect(() => {
        // Scroll to bottom when history updates
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const fetchAllActiveGuests = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    id, guest_id, check_in, check_out,
                    guest:guests ( first_name, last_name ),
                    room:rooms ( number )
                `)
                .eq('property_id', user?.propertyId)
                .in('status', ['Checked In', 'Confirmed'])
                .lte('check_in', today)
                .gte('check_out', today);

            if (error) throw error;

            if (data) {
                const activeRecipients: Recipient[] = data.map((r: any) => ({
                    reservation_id: r.id,
                    guest_id: r.guest_id,
                    name: r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : 'Unknown Guest',
                    room_number: r.room?.number
                }));
                // Deduplicate by guest_id just in case
                const unique = Array.from(new Map(activeRecipients.map(r => [r.guest_id, r])).values());
                setRecipients(unique);
            }
        } catch (error) {
            console.error("Error fetching active guests for broadcast:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (reservationId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/messages/${reservationId}?property_id=${user?.propertyId}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Error fetching message history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!messageContent.trim() || recipients.length === 0) return;

        setSending(true);
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    recipients: recipients.map(r => ({ reservation_id: r.reservation_id, guest_id: r.guest_id })),
                    content: messageContent,
                })
            });

            if (!response.ok) throw new Error("Failed to send message");

            // Optimistically update UI if single chat
            if (isSingle) {
                const newMessage: Message = {
                    id: Date.now().toString(),
                    content: messageContent,
                    direction: 'outbound',
                    created_at: new Date().toISOString(),
                    sender_name: user?.email // Optional: Get actual name
                };
                setHistory(prev => [...prev, newMessage]);
                setMessageContent('');
            } else {
                // For broadcast, just close and show success
                alert(`Successfully sent message to ${recipients.length} guest(s).`);
                onClose();
            }

        } catch (error) {
            console.error("Error sending message:", error);
            alert("An error occurred while sending the message.");
        } finally {
            setSending(false);
            if (isSingle) {
                // Keep modal open for chat, but clear input
                setMessageContent('');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isBroadcast ? "Broadcast Message" : isSingle ? `Message ${recipients[0].name}` : `Message ${recipients.length} Guests`}
        >
            <div className="flex flex-col h-[60vh] max-h-[600px]">

                {/* Recipients Banner for Broadcast/Multiple */}
                {!isSingle && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex items-center gap-3 flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-900 text-sm">
                                {loading ? 'Fetching recipients...' : `Sending to ${recipients.length} active guest(s)`}
                            </p>
                            <p className="text-xs text-blue-700 mt-0.5">They will receive this as an individual SMS message.</p>
                        </div>
                    </div>
                )}

                {/* Subtitle for Single */}
                {isSingle && recipients[0].room_number && (
                    <div className="text-sm text-slate-500 mb-4 flex-shrink-0 border-b pb-2">
                        Room {recipients[0].room_number} • Currently Checked In
                    </div>
                )}

                {/* Chat History View (Only for Single Recipient) */}
                {isSingle && (
                    <div className="flex-1 overflow-y-auto mb-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                        {loading && history.length === 0 ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                <MessageSquare className="w-8 h-8 opacity-50" />
                                <p className="text-sm">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {history.map(msg => {
                                    const isOutbound = msg.direction === 'outbound';
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                max-w-[85%] rounded-2xl px-4 py-2 text-sm
                                                ${isOutbound ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'}
                                            `}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isOutbound && msg.sender_name && ` • ${msg.sender_name}`}
                                            </span>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                )}

                {/* Input Area */}
                <div className="mt-auto flex-shrink-0 bg-white pt-2">
                    <div className="relative">
                        <textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder={isSingle ? "Type a message..." : "Type your broadcast message..."}
                            className="w-full border border-slate-300 rounded-xl pl-4 pr-12 pt-3 pb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 text-sm"
                            disabled={loading || sending || recipients.length === 0}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!messageContent.trim() || sending || recipients.length === 0}
                            className="absolute bottom-4 right-4 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full transition-colors"
                        >
                            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    {isBroadcast && (
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Double check your message before sending to all guests.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MessagingModal;
