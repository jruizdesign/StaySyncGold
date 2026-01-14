const API_URL = 'http://localhost:3001/api/staff';

export const getStaff = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch staff');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

export const createStaff = async (staffData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    if (!response.ok) {
      throw new Error('Failed to create staff member');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
};

export const clockIn = async (pin, property_id) => {
  try {
    const response = await fetch(`${API_URL}/clock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin, property_id }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to clock in');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

export const clockOut = async (pin, property_id) => {
  try {
    const response = await fetch(`${API_URL}/clock-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin, property_id }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to clock out');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

export const getClockHistory = async (property_id) => {
  try {
    const response = await fetch(`${API_URL}/clock-history?property_id=${property_id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch clock history');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching clock history:', error);
    throw error;
  }
};
