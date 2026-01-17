const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/reports`;

export const getFinancialReport = async () => {
  try {
    const response = await fetch(`${API_URL}/financial`);
    if (!response.ok) {
      throw new Error('Failed to fetch financial report');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }
};

export const getDailyRoomCosts = async () => {
  try {
    const response = await fetch(`${API_URL}/daily-room-costs`);
    if (!response.ok) {
      throw new Error('Failed to fetch daily room costs');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily room costs:', error);
    throw error;
  }
};
