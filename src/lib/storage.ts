
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

/**
 * Save audio blob to IndexedDB
 */
export const saveAudioToStorage = async (id: string, audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('audioStorage', 1);
      
      request.onupgradeneeded = function(event) {
        const db = request.result;
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = function(event) {
        const db = request.result;
        const transaction = db.transaction(['audioFiles'], 'readwrite');
        const store = transaction.objectStore('audioFiles');
        
        const audioData = {
          id,
          blob: audioBlob,
          timestamp: new Date().getTime()
        };
        
        const storeRequest = store.put(audioData);
        
        storeRequest.onsuccess = function() {
          resolve();
        };
        
        storeRequest.onerror = function(error) {
          reject(error);
        };
        
        transaction.oncomplete = function() {
          db.close();
        };
      };
      
      request.onerror = function(error) {
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Load audio blob from IndexedDB
 */
export const loadAudioFromStorage = async (id: string): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('audioStorage', 1);
      
      request.onupgradeneeded = function(event) {
        const db = request.result;
        if (!db.objectStoreNames.contains('audioFiles')) {
          db.createObjectStore('audioFiles', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = function(event) {
        const db = request.result;
        const transaction = db.transaction(['audioFiles'], 'readonly');
        const store = transaction.objectStore('audioFiles');
        
        const getRequest = store.get(id);
        
        getRequest.onsuccess = function() {
          if (getRequest.result) {
            resolve(getRequest.result.blob);
          } else {
            resolve(null);
          }
        };
        
        getRequest.onerror = function(error) {
          reject(error);
        };
        
        transaction.oncomplete = function() {
          db.close();
        };
      };
      
      request.onerror = function(error) {
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Remove audio blob from IndexedDB
 */
export const removeAudioFromStorage = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('audioStorage', 1);
      
      request.onsuccess = function(event) {
        const db = request.result;
        const transaction = db.transaction(['audioFiles'], 'readwrite');
        const store = transaction.objectStore('audioFiles');
        
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = function() {
          resolve();
        };
        
        deleteRequest.onerror = function(error) {
          reject(error);
        };
        
        transaction.oncomplete = function() {
          db.close();
        };
      };
      
      request.onerror = function(error) {
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
};
