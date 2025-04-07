
/**
 * Save data to localStorage with a specific key
 */
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
};

/**
 * Load data from localStorage with a specific key
 */
export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error loading from localStorage: ${error}`);
    return null;
  }
};

/**
 * Remove data from localStorage with a specific key
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
};
