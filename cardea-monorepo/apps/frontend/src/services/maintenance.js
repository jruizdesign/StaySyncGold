import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/maintenance`;

export const getMaintenanceRecords = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch maintenance records');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    throw error;
  }
};

export const createMaintenanceRecord = async (maintenanceData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maintenanceData),
    });
    if (!response.ok) {
      throw new Error('Failed to create maintenance record');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    throw error;
  }
};

export const updateMaintenanceRecord = async (id, maintenanceData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maintenanceData),
    });
    if (!response.ok) {
      throw new Error('Failed to update maintenance record');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    throw error;
  }
};

export const deleteMaintenanceRecord = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete maintenance record');
    }
    return true; // Or return a success message
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    throw error;
  }
};

export const getMaintenanceLogs = getMaintenanceRecords;