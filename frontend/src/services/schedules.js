const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/schedules`;

export const getSchedules = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

export const createSchedule = async (scheduleData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      throw new Error('Failed to create schedule');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

export const updateSchedule = async (id, scheduleData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      throw new Error('Failed to update schedule');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

export const deleteSchedule = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete schedule');
    }
    // No content on successful delete
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};
