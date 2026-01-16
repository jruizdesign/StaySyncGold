import { supabase } from './supabase';

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogEntry {
    level: LogLevel;
    message: string;
    type?: string; // e.g. 'AUTH', 'DATABASE', 'USER_ACTION'
    event?: string; // specific event name e.g. 'LOGIN_SUCCESS', 'ROOM_CREATED'
    user_id?: string;
    property_id?: string;
    details?: any;
}

export const logger = {
    info: (message: string, context?: Partial<LogEntry>) => log('INFO', message, context),
    warn: (message: string, context?: Partial<LogEntry>) => log('WARNING', message, context),
    error: (message: string, context?: Partial<LogEntry>) => log('ERROR', message, context),
    critical: (message: string, context?: Partial<LogEntry>) => log('CRITICAL', message, context),
};

const log = async (level: LogLevel, message: string, context: Partial<LogEntry> = {}) => {
    // Always log to console in dev/demo
    console.log(`[${level}] ${message}`, context);

    try {
        const { error } = await supabase.from('system_logs').insert({
            level,
            message,
            type: context.type || 'SYSTEM',
            event: context.event || 'GENERIC_LOG',
            user_id: context.user_id,
            property_id: context.property_id,
            details: context.details || {},
            timestamp: new Date().toISOString()
        });

        if (error) {
            console.error('Failed to persist log to Supabase:', error);
        }
    } catch (err) {
        console.error('Logger exception:', err);
    }
};
