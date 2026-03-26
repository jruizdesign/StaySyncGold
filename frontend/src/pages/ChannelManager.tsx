import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UIComponents';
import { Plus, RefreshCw, Loader, Globe2, Building2, Key, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ChannexPropertySync from '../components/ChannexPropertySync';
import ChannexRoomMapping from '../components/ChannexRoomMapping';
import ChannexARIManager from '../components/ChannexARIManager';
import { SaaSUpgradeLock } from '../components/SaaSUpgradeLock';

// Error Boundary to catch ARI Manager rendering errors
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error in ARI Manager:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card className="p-6 bg-red-50 border-red-200">
                    <div className="text-red-900">
                        <h3 className="text-lg font-semibold mb-2">⚠️ ARI Manager Error</h3>
                        <p className="text-sm mb-2">The ARI Manager component failed to render:</p>
                        <pre className="text-xs bg-red-100 p-3 rounded overflow-auto">
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                        <p className="text-xs mt-2 text-red-700">Check browser console for details</p>
                    </div>
                </Card>
            );
        }
        return this.props.children;
    }
}

interface ChannelSetting {
    id: string;
    property_id: string;
    channel_name: string;
    api_key?: string;
    property_mapping_id?: string;
    is_active: boolean;
    status: string;
    channex_property_id?: string;
    channex_channel_id?: string;
    last_sync?: string;
}

const POPULAR_CHANNELS = [
    { id: 'booking', name: 'Booking.com', icon: '🏨', color: 'bg-blue-600' },
    { id: 'airbnb', name: 'Airbnb', icon: '🏠', color: 'bg-rose-500' },
    { id: 'expedia', name: 'Expedia', icon: '✈️', color: 'bg-yellow-500' },
    { id: 'vrbo', name: 'Vrbo', icon: '🏖️', color: 'bg-indigo-600' },
    { id: 'agoda', name: 'Agoda', icon: '🌎', color: 'bg-violet-500' }
];

const ChannelManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [channelSettings, setChannelSettings] = useState<ChannelSetting[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [hotelId, setHotelId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const checkFeature = async () => {
            if (user?.propertyId) {
                const { data } = await supabase.from('properties').select('enable_channel_manager').eq('id', user.propertyId).single();
                if (!data?.enable_channel_manager) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }
                setHasAccess(true);
                fetchChannelSettings();
                fetchRoomMappings();
            }
        };
        checkFeature();
    }, [user?.propertyId]);

    const fetchChannelSettings = async () => {
        if (!user?.propertyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('channel_settings')
                .select('*')
                .eq('property_id', user.propertyId);

            if (error) throw error;
            setChannelSettings(data || []);
        } catch (err) {
            console.error('Error fetching channel settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomMappings = async () => {
        if (!user?.propertyId) return;
        try {
            const { error } = await supabase
                .from('channel_mappings')
                .select('*');

            if (error) throw error;

        } catch (err) {
            console.error('Error fetching room mappings:', err);
        }
    };

    const handleSyncToChannex = async () => {
        setIsSyncing(true);
        try {
            // This will be implemented with MCP tools
            alert('Channex sync functionality will be implemented via MCP tools. Please configure your Channex API key in the MCP settings first.');

            // TODO: Call MCP tools:
            // 1. channex_create_property or channex_update_property
            // 2. Update channel_settings with channex_property_id
            // 3. Sync room types
            // 4. Create rate plans

        } catch (err: any) {
            console.error('Sync error:', err);
            alert('Failed to sync: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveChannel = async () => {
        if (!user?.propertyId || !selectedChannel || !apiKey || !hotelId) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('channel_settings')
                .insert([{
                    property_id: user.propertyId,
                    channel_name: selectedChannel,
                    api_key: apiKey,
                    property_mapping_id: hotelId,
                    is_active: true,
                    status: 'Connected'
                }]);

            if (error) throw error;
            
            // Reset and refresh
            setShowAddModal(false);
            setSelectedChannel(null);
            setApiKey('');
            setHotelId('');
            await fetchChannelSettings();
        } catch (err: any) {
            console.error('Error saving channel:', err);
            alert('Failed to connect channel: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-gold-500" />
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="p-8 pb-32">
                <SaaSUpgradeLock 
                    moduleName="Channel Manager" 
                    description="Connect to 100+ OTAs (Booking.com, Airbnb, Expedia) and seamlessly sync rates & availability." 
                    icon="channel" 
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Channel Manager</h1>
                    <p className="text-slate-600 mt-1">Manage all your OTA direct integrations</p>
                </div>
                <div className="flex gap-2">
                    <Button icon={RefreshCw} onClick={fetchChannelSettings} variant="ghost">
                        Refresh
                    </Button>
                    <Button icon={Plus} onClick={() => setShowAddModal(true)}>
                        Add Channel
                    </Button>
                </div>
            </div>

            {/* Configured Channels Grid */}
            {channelSettings.filter(c => c.channel_name !== 'channex').length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {channelSettings.filter(c => c.channel_name !== 'channex').map(channel => {
                        const dict = POPULAR_CHANNELS.find(p => p.id === channel.channel_name);
                        return (
                            <Card key={channel.id} className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${dict?.color || 'bg-slate-800'} text-white shadow-sm`}>
                                            {dict?.icon || <Globe2 className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{dict?.name || channel.channel_name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-xs text-emerald-700 font-medium tracking-wide uppercase">Connected</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 flex justify-between items-center">
                                    <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Property ID</span>
                                    <span className="font-mono font-medium text-slate-900">{channel.property_mapping_id}</span>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal for Adding a Channel */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Connect New Channel</h2>
                                <p className="text-slate-500 text-sm mt-1">Select an OTA to link to your property.</p>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setSelectedChannel(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            {!selectedChannel ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {POPULAR_CHANNELS.map(channel => (
                                        <div 
                                            key={channel.id} 
                                            onClick={() => setSelectedChannel(channel.id)}
                                            className="border-2 border-slate-100 hover:border-gold-500 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all text-center group flex flex-col items-center justify-center gap-4 bg-white"
                                        >
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform ${channel.color} text-white`}>
                                                {channel.icon}
                                            </div>
                                            <span className="font-bold text-slate-800 text-lg">{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-md mx-auto py-8">
                                    <div className="flex flex-col items-center mb-8">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md mb-4 ${POPULAR_CHANNELS.find(c => c.id === selectedChannel)?.color} text-white`}>
                                            {POPULAR_CHANNELS.find(c => c.id === selectedChannel)?.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900">Connect {POPULAR_CHANNELS.find(c => c.id === selectedChannel)?.name}</h3>
                                        <p className="text-center text-slate-500 mt-2">Enter your API credentials to establish the synchronization link.</p>
                                    </div>
                                    
                                    <Input
                                        label="Hotel / Property ID"
                                        type="text"
                                        placeholder="e.g. 102938475"
                                        value={hotelId}
                                        onChange={(e) => setHotelId(e.target.value)}
                                        icon={Building2}
                                    />
                                    
                                    <Input
                                        label="API Key / Access Token"
                                        type="password"
                                        placeholder="Enter your secure token"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        icon={Key}
                                    />
                                </div>
                            )}
                        </div>
                        
                        {selectedChannel && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
                                <Button variant="ghost" onClick={() => setSelectedChannel(null)} className="text-slate-500 font-semibold px-6">
                                    &larr; Back to List
                                </Button>
                                <Button 
                                    onClick={handleSaveChannel} 
                                    disabled={!apiKey || !hotelId || isSaving}
                                    className="px-8 font-semibold shadow-lg"
                                >
                                    {isSaving ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                    {isSaving ? 'Connecting...' : 'Connect Channel'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Property Sync Component */}
            <ChannexPropertySync
                propertyId={user?.propertyId || 'cb3b3bf3-b34b-4062-a4fe-a588a7c684fb'}
                channexPropertyId={channelSettings.find(c => c.channel_name === 'channex')?.channex_property_id}
                lastSync={channelSettings.find(c => c.channel_name === 'channex')?.last_sync}
                onSyncComplete={fetchChannelSettings}
            />

            {/* Room Type Mappings Component */}
            <ChannexRoomMapping
                propertyId={user?.propertyId || 'cb3b3bf3-b34b-4062-a4fe-a588a7c684fb'}
                onMappingsSaved={fetchRoomMappings}
            />

            {/* ARI Manager Component */}
            <ErrorBoundary>
                <ChannexARIManager
                    propertyId={user?.propertyId || 'cb3b3bf3-b34b-4062-a4fe-a588a7c684fb'}
                />
            </ErrorBoundary>

            {/* Instructions Card */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Getting Started with Channex</h3>
                <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                        <span className="font-bold">1.</span>
                        <span>Configure your Channex API key in the MCP settings</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold">2.</span>
                        <span>Click "Sync to Channex" to create/update your property</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold">3.</span>
                        <span>Map your room types to Channex room types</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold">4.</span>
                        <span>Create rate plans and connect OTA channels</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold">5.</span>
                        <span>Push rates and availability to start receiving bookings</span>
                    </li>
                </ol>
            </Card>
        </div>
    );
};

export default ChannelManager;
