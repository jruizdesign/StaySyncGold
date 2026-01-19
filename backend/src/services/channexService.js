const axios = require('axios');

class ChannexService {
    constructor() {
        this.baseUrl = 'https://app.channex.io/api/v1';
    }

    // Validate the API Key by fetching the user's properties list
    async validateConnection(apiKey) {
        return this.getProperties(apiKey);
    }

    async getProperties(apiKey) {
        try {
            const response = await axios.get(`${this.baseUrl}/properties`, {
                headers: { 'Authorization': 'Bearer ' + apiKey }
            });
            return { success: true, data: response.data.data || [] };
        } catch (error) {
            console.error('Channex Properties Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            // Handle 401 specifically
            if (error.response?.status === 401) return { success: false, error: 'Invalid API Key' };
            return { success: false, error: msg };
        }
    }

    // Fetch *active* OTA connections for a property
    async getActiveChannels(apiKey, propertyId) {
        try {
            const response = await axios.get(`${this.baseUrl}/channels`, {
                headers: { 'Authorization': 'Bearer ' + apiKey },
                params: { 'filter[property_id]': propertyId }
            });

            return { success: true, data: response.data.data || [] };
        } catch (error) {
            console.error('Channex Channels Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }

    async getRoomTypes(apiKey, propertyId) {
        try {
            const response = await axios.get(`${this.baseUrl}/room_types`, {
                headers: { 'Authorization': 'Bearer ' + apiKey },
                params: { 'filter[property_id]': propertyId }
            });
            return { success: true, data: response.data.data || [] };
        } catch (error) {
            console.error('Channex Room Types Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }

    async fetchBookings(apiKey, propertyId) {
        try {
            const response = await axios.get(`${this.baseUrl}/bookings`, {
                headers: { 'Authorization': 'Bearer ' + apiKey },
                params: {
                    'filter[property_id]': propertyId,
                    'limit': 100
                }
            });
            return { success: true, data: response.data.data || [] };
        } catch (error) {
            console.error('Channex Fetch Bookings Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }

    async generateOneTimeToken(apiKey, propertyId, username) {
        try {
            const response = await axios.post(`${this.baseUrl}/auth/one_time_token`, {
                one_time_token: {
                    property_id: propertyId,
                    username: username
                }
            }, {
                headers: { 'Authorization': 'Bearer ' + apiKey }
            });
            return { success: true, token: response.data.data.token };
        } catch (error) {
            console.error('Channex One-Time Token Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }

    // Push ARI (Availability, Rates, Inventory) updates
    async pushARI(apiKey, propertyId, updates) {
        try {
            // updates should be an array of objects: { property_id, room_type_id, date, availability, rate_plan_id, rate }
            // Channex expects: { values: [ ... ] }
            const payload = { values: updates };

            const response = await axios.post(`${this.baseUrl}/ari`, payload, {
                headers: { 'Authorization': 'Bearer ' + apiKey }
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Channex ARI Push Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }
}

module.exports = new ChannexService();