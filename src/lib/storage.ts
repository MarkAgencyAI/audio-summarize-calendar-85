
/**
 * A simple localStorage wrapper to provide AsyncStorage API for web
 */
export default {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }
};
