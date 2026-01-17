const axios = require('axios');

class ChannexService {
    constructor() {
        this.baseUrl = 'https://app.channex.io/api/v1';
    }

    // Validate the API Key by fetching the user's properties list
    async validateConnection(apiKey) {
        try {
            const response = await axios.get(`${this.baseUrl}/properties`, {
                headers: { 'user-api-key': apiKey }
            });
            return { success: true, data: response.data };
        } catch (error) {
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }

    // Mock-ish implementation of fetching *active* OTA connections for a property
    // In reality, you'd list Channels for the Property in Channex
    async getActiveChannels(apiKey, propertyId) {
        try {
            const response = await axios.get(`${this.baseUrl}/channels`, {
                headers: { 'user-api-key': apiKey },
                params: { 'filter[property_id]': propertyId }
            });

            // Map Channex response to our simple UI format
            // Channex returns: { data: [ { attributes: { title: "Booking.com", is_active: true } } ] }
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
                headers: { 'user-api-key': apiKey },
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
            // Fetch recent bookings (e.g., created or modified)
            const response = await axios.get(`${this.baseUrl}/bookings`, {
                headers: { 'user-api-key': apiKey },
                params: {
                    'filter[property_id]': propertyId,
                    'limit': 50 // Limit for now
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
                headers: { 'user-api-key': apiKey }
            });
            return { success: true, token: response.data.data.token };
        } catch (error) {
            console.error('Channex One-Time Token Error:', error.response?.data || error.message);
            const msg = error.response?.data?.errors?.[0]?.detail || error.message;
            return { success: false, error: msg };
        }
    }
}

module.exports = new ChannexService();
