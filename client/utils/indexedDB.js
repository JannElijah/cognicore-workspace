const DB_NAME = 'CogniCoreOfflineDB';
const STORE_NAME = 'telemetry_queue';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => reject(e.target.error);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { autoIncrement: true });
                }
            };
        });
    }
    return dbPromise;
}

export async function saveTelemetry(telemetryData) {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(telemetryData);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB Save Error:", e);
        // Fallback to localStorage if IndexedDB fails
        try {
            const currentFallbackStr = localStorage.getItem('offline_telemetry_fallback') || '[]';
            
            let queue = JSON.parse(currentFallbackStr);
            
            // Circuit breaker: Keep queue under 1000 items to prevent UI stalling and quota errors
            if (queue.length >= 1000) {
                console.warn("CIRCUIT BREAKER: localStorage offline telemetry cache reached 1000 items. Dropping oldest event.");
                queue.shift(); // Remove the oldest item
                window.dispatchEvent(new CustomEvent('offline-cache-full'));
            }

            queue.push(telemetryData);
            localStorage.setItem('offline_telemetry_fallback', JSON.stringify(queue));
        } catch (err) {
            console.warn("CIRCUIT BREAKER TRIPPED (Quota Exceeded): Failed to save offline telemetry.", err);
            window.dispatchEvent(new CustomEvent('offline-cache-full'));
        }
        return false;
    }
}

export async function getTelemetryQueue() {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            const keysRequest = store.getAllKeys();
            
            transaction.oncomplete = () => {
                const results = request.result || [];
                const keys = keysRequest.result || [];
                // Attach _id for deletion later
                const dataWithKeys = results.map((item, index) => ({ ...item, _id: keys[index] }));
                
                // Check fallback
                try {
                    const fallback = JSON.parse(localStorage.getItem('offline_telemetry_fallback') || '[]');
                    const fallbackWithKeys = fallback.map((item, index) => ({ ...item, _id: 'fallback_' + index }));
                    resolve([...dataWithKeys, ...fallbackWithKeys]);
                } catch (e) {
                    resolve(dataWithKeys);
                }
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (e) {
        console.error("IndexedDB Get Error:", e);
        try {
            const fallback = JSON.parse(localStorage.getItem('offline_telemetry_fallback') || '[]');
            return fallback.map((item, index) => ({ ...item, _id: 'fallback_' + index }));
        } catch (err) {
            return [];
        }
    }
}

export async function deleteTelemetryItems(keys) {
    if (!keys || keys.length === 0) return true;
    
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            let hasFallback = false;
            keys.forEach(key => {
                if (typeof key === 'string' && key.startsWith('fallback_')) {
                    hasFallback = true;
                } else {
                    store.delete(key);
                }
            });
            
            transaction.oncomplete = () => {
                if (hasFallback) {
                    // For simplicity, wipe fallback completely since we only use it if DB fails entirely
                    localStorage.removeItem('offline_telemetry_fallback');
                }
                resolve(true);
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (e) {
        console.error("IndexedDB Delete Error:", e);
        localStorage.removeItem('offline_telemetry_fallback');
        return false;
    }
}
