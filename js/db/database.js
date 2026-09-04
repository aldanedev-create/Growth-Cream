// Core database management
const DB_NAME = 'GrowthCreamDB';
const DB_VERSION = 1;

let dbInstance = null;

export function openDatabase() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            dbInstance.onerror = (event) => {
                console.error('Database error:', event.target.error);
            };
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            // Create object stores
            if (oldVersion < 1) {
                // Habits store
                const habitsStore = db.createObjectStore('habits', { keyPath: 'id' });
                habitsStore.createIndex('createdAt', 'createdAt');
                habitsStore.createIndex('frequency', 'frequency');

                // Habit completions store
                const completionsStore = db.createObjectStore('habitCompletions', { keyPath: 'id' });
                completionsStore.createIndex('habitId', 'habitId');
                completionsStore.createIndex('date', 'date');
                completionsStore.createIndex('habitId_date', ['habitId', 'date'], { unique: true });

                // Projects store
                const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
                projectsStore.createIndex('status', 'status');
                projectsStore.createIndex('createdAt', 'createdAt');

                // Tasks store
                const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
                tasksStore.createIndex('projectId', 'projectId');
                tasksStore.createIndex('completed', 'completed');

                // Goals store
                const goalsStore = db.createObjectStore('goals', { keyPath: 'id' });
                goalsStore.createIndex('completed', 'completed');
                goalsStore.createIndex('targetDate', 'targetDate');

                // Notes store
                const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                notesStore.createIndex('projectId', 'projectId');
                notesStore.createIndex('createdAt', 'createdAt');

                // Images store (metadata only, not large blobs)
                const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
                imagesStore.createIndex('createdAt', 'createdAt');

                // Image jobs store
                const imageJobsStore = db.createObjectStore('imageJobs', { keyPath: 'id' });
                imageJobsStore.createIndex('status', 'status');
                imageJobsStore.createIndex('createdAt', 'createdAt');

                // Storage devices store
                const storageDevicesStore = db.createObjectStore('storageDevices', { keyPath: 'id' });
                storageDevicesStore.createIndex('name', 'name');

                // Storage snapshots store
                const storageSnapshotsStore = db.createObjectStore('storageSnapshots', { keyPath: 'id' });
                storageSnapshotsStore.createIndex('deviceId', 'deviceId');
                storageSnapshotsStore.createIndex('timestamp', 'timestamp');

                // Settings store
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    });
}

export function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

// Generic CRUD operations
export async function createRecord(storeName, record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => {
            console.error(`Failed to create record in ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function readRecord(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Failed to read record from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function readAllRecords(storeName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Failed to read all records from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function updateRecord(storeName, record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => {
            console.error(`Failed to update record in ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function deleteRecord(storeName, id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Failed to delete record from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function clearStore(storeName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Failed to clear store ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function getByIndex(storeName, indexName, value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Failed to query ${storeName} by ${indexName}:`, request.error);
            reject(request.error);
        };
    });
}

export async function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}