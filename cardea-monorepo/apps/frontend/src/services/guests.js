import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/guests`;

export const getGuests = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch guests');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching guests:', error);
    throw error;
  }
};
