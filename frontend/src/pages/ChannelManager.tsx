import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UIComponents';
import { Plus, RefreshCw, Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ChannexPropertySync from '../components/ChannexPropertySync';
import ChannexRoomMapping from '../components/ChannexRoomMapping';
import ChannexARIManager from '../components/ChannexARIManager';

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

interface RoomMapping {
    id: string;
    channel_setting_id: string;
    local_room_type?: string;
    channel_room_id?: string;
    channex_room_type_id?: string;
    channex_rate_plan_id?: string;
}

const ChannelManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [channelSettings, setChannelSettings] = useState<ChannelSetting[]>([]);
    const [roomMappings, setRoomMappings] = useState<RoomMapping[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelSetting | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (user?.propertyId) {
            fetchChannelSettings();
            fetchRoomMappings();
        }
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
            const { data, error } = await supabase
                .from('channel_mappings')
                .select('*');

            if (error) throw error;
            setRoomMappings(data || []);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-gold-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Channel Manager</h1>
                    <p className="text-slate-600 mt-1">Manage OTA integrations via Channex</p>
                </div>
                <div className="flex gap-2">
                    <Button icon={RefreshCw} onClick={fetchChannelSettings} variant="ghost">
                        Refresh
                    </Button>
                    <Button icon={Plus} onClick={handleSyncToChannex} disabled={isSyncing}>
                        {isSyncing ? 'Syncing...' : 'Sync to Channex'}
                    </Button>
                </div>
            </div>

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
