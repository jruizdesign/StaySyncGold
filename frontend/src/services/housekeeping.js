import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/housekeeping`;

export const getHousekeepingLogs = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch housekeeping logs');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching housekeeping logs:', error);
    throw error;
  }
};
