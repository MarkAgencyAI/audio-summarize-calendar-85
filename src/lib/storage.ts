
// Simple wrapper around localStorage to provide an AsyncStorage-like API
const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  },
  
  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
  
  getAllKeys: async (): Promise<string[]> => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting all keys from localStorage:', error);
      return [];
    }
  }
};

// Add the loadFromStorage and saveToStorage functions
export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error(`Error loading from storage (key: ${key}):`, error);
    return null;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Error saving to storage (key: ${key}):`, error);
  }
};

export default AsyncStorage;
