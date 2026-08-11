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
            
            request.onsuccess = () => {
                const results = request.result || [];
                // Check fallback
                try {
                    const fallback = JSON.parse(localStorage.getItem('offline_telemetry_fallback') || '[]');
                    resolve([...results, ...fallback]);
                } catch (e) {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB Get Error:", e);
        try {
            return JSON.parse(localStorage.getItem('offline_telemetry_fallback') || '[]');
        } catch (err) {
            return [];
        }
    }
}

export async function clearTelemetryQueue() {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => {
                localStorage.removeItem('offline_telemetry_fallback');
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("IndexedDB Clear Error:", e);
        localStorage.removeItem('offline_telemetry_fallback');
        return false;
    }
}
