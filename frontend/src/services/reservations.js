const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/reservations`;

export const getReservations = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};
