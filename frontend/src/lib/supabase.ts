import { createClient } from '@supabase/supabase-js';
import { mockFetch } from './mockDb';

// Cast to string to resolve TypeScript "property does not exist" errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env file.');
}

const customFetch = (url: RequestInfo | URL, init?: RequestInit) => {
    if (typeof window !== 'undefined' && localStorage.getItem('LIVE_TRIAL') === 'true') {
        return mockFetch(url, init);
    }
    return fetch(url, init);
};

// Provide fallback placeholders to prevent the client from crashing the app on initialization
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    realtime: {
        log_level: 'error', // Silence info/debug logs
    },
    global: {
        fetch: customFetch
    }
});
