import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Setup the localizer
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

interface Resource {
    id: string;
    title: string; // Room Name/Number
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resourceId: string; // Room ID
    status: string;
    guestName: string;
    originalData: any;
}

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user?.propertyId) return;
        setLoading(true);
        try {
            // 1. Fetch Rooms (Resources)
            const { data: roomsData, error: roomsError } = await supabase
                .from('rooms')
                .select('*')
                .eq('property_id', user.propertyId)
                .order('number', { ascending: true });

            if (roomsError) throw roomsError;

            const roomResources: Resource[] = (roomsData || []).map(r => ({
                id: r.id,
                title: `Room ${r.number} - ${r.type}`,
            }));
            setResources(roomResources);

            // 2. Fetch Bookings (Events)
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .eq('property_id', user.propertyId)
                .neq('status', 'cancelled');

            if (bookingsError) throw bookingsError;

            const calendarEvents: CalendarEvent[] = (bookingsData || []).map(b => ({
                id: b.id,
                title: `${b.guest_name} (${b.status})`,
                start: new Date(b.arrival_date),
                end: new Date(b.departure_date),
                resourceId: b.room_id,
                status: b.status,
                guestName: b.guest_name,
                originalData: b
            }));

            setEvents(calendarEvents);

        } catch (err) {
            console.error('Error fetching calendar data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.propertyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Event Move (Drag & Drop)
    const moveEvent = async ({ event, start, end, resourceId }: any) => {
        const updatedEvents = events.map(existingEvent => {
            return existingEvent.id === event.id
                ? { ...existingEvent, start, end, resourceId }
                : existingEvent;
        });
        setEvents(updatedEvents);

        try {
            // Direct update to bookings table
            await supabase
                .from('bookings')
                .update({
                    arrival_date: start.toISOString(),
                    departure_date: end.toISOString(),
                    room_id: resourceId
                })
                .eq('id', event.id);

            // Also update linked reservation if possible
            const rawId = event.originalData.raw_data?.id; // If jsonb link exists
            if (rawId) {
                await supabase
                    .from('reservations')
                    .update({
                        check_in: start.toISOString(),
                        check_out: end.toISOString(),
                        room_id: resourceId
                    })
                    .eq('id', rawId);
            }

        } catch (err) {
            console.error("Failed to move event:", err);
            fetchData(); // Revert
        }
    };

    // Handle Resize
    const resizeEvent = async ({ event, start, end }: any) => {
        const updatedEvents = events.map(existingEvent => {
            return existingEvent.id === event.id
                ? { ...existingEvent, start, end }
                : existingEvent;
        });
        setEvents(updatedEvents);

        try {
            await supabase
                .from('bookings')
                .update({
                    arrival_date: start.toISOString(),
                    departure_date: end.toISOString()
                })
                .eq('id', event.id);

            const rawId = event.originalData.raw_data?.id;
            if (rawId) {
                await supabase
                    .from('reservations')
                    .update({
                        check_in: start.toISOString(),
                        check_out: end.toISOString()
                    })
                    .eq('id', rawId);
            }
        } catch (err) {
            console.error("Failed to resize:", err);
            fetchData();
        }
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = '#3b82f6'; // blue-500 default
        if (event.status === 'Checked In') backgroundColor = '#10b981'; // emerald-500
        if (event.status === 'Checked Out') backgroundColor = '#64748b'; // slate-500
        if (event.status === 'Pending') backgroundColor = '#f59e0b'; // amber-500

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontSize: '0.75rem'
            }
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        Live Calendar
                    </h1>
                    <p className="text-slate-500">Manage bookings via drag-and-drop.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                {/* @ts-ignore - React Big Calendar types are tricky with DnD */}
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor={(event: any) => new Date(event.start)}
                    endAccessor={(event: any) => new Date(event.end)}
                    resources={resources}
                    resourceIdAccessor={(resource: any) => resource.id}
                    resourceTitleAccessor={(resource: any) => resource.title}

                    defaultView={Views.DAY}
                    views={['day', 'week', 'month', 'agenda']}
                    step={60}
                    showMultiDayTimes

                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    eventPropGetter={eventStyleGetter as any}
                    resizable
                    selectable

                    className="h-full font-sans text-sm"

                    components={{
                        event: ({ event }: any) => (
                            <div className="text-xs font-semibold p-1 truncate" title={event.title}>
                                {event.title}
                            </div>
                        )
                    }}
                />
            </div>
        </div>
    );
};

export default CalendarPage;
