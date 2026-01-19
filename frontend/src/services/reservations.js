import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/reservations`;

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
