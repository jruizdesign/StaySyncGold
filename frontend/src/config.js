export const getApiBaseUrl = () => {
    const url = import.meta.env.VITE_API_BASE_URL;

    if (!url) {
        if (import.meta.env.PROD) {
            throw new Error('VITE_API_BASE_URL is not defined in production environment');
        }
        return 'http://localhost:5000';
    }

    return url;
};

export const API_BASE_URL = getApiBaseUrl();
