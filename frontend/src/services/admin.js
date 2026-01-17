const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/admin`;

export const getProperties = async () => {
  try {
    const response = await fetch(`${API_URL}/properties`);
    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

export const createProperty = async (propertyData) => {
  try {
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    });
    if (!response.ok) {
      throw new Error('Failed to create property');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
};

export const assignUserRole = async (userId, role, propertyId = null) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/assign-role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role, property_id: propertyId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to assign role');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};
