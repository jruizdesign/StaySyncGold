const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users`;

export const getUsers = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
