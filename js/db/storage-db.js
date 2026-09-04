import { createRecord, readRecord, readAllRecords, updateRecord, deleteRecord, getByIndex, generateId } from './database.js';

export async function createStorageDevice(deviceData) {
    const device = {
        id: await generateId(),
        name: deviceData.name,
        type: deviceData.type || 'folder',
        totalBytes: deviceData.totalBytes || 0,
        usedBytes: deviceData.usedBytes || 0,
        freeBytes: deviceData.freeBytes || 0,
        createdAt: new Date().toISOString()
    };
    
    await createRecord('storageDevices', device);
    return device;
}

export async function getStorageDevice(id) {
    return await readRecord('storageDevices', id);
}

export async function getAllStorageDevices() {
    return await readAllRecords('storageDevices');
}

export async function updateStorageDevice(id, updates) {
    const device = await getStorageDevice(id);
    if (!device) {
        throw new Error('Storage device not found');
    }
    
    const updatedDevice = {
        ...device,
        ...updates,
        id: device.id
    };
    
    await updateRecord('storageDevices', updatedDevice);
    return updatedDevice;
}

export async function deleteStorageDevice(id) {
    await deleteRecord('storageDevices', id);
    
    // Delete associated snapshots
    const snapshots = await getSnapshotsForDevice(id);
    for (const snapshot of snapshots) {
        await deleteRecord('storageSnapshots', snapshot.id);
    }
}

export async function createStorageSnapshot(snapshotData) {
    const snapshot = {
        id: await generateId(),
        deviceId: snapshotData.deviceId,
        timestamp: new Date().toISOString(),
        totalBytes: snapshotData.totalBytes || 0,
        usedBytes: snapshotData.usedBytes || 0,
        freeBytes: snapshotData.freeBytes || 0
    };
    
    await createRecord('storageSnapshots', snapshot);
    return snapshot;
}

export async function getStorageSnapshot(id) {
    return await readRecord('storageSnapshots', id);
}

export async function getSnapshotsForDevice(deviceId) {
    return await getByIndex('storageSnapshots', 'deviceId', deviceId);
}

export async function getAllStorageSnapshots() {
    return await readAllRecords('storageSnapshots');
}

export async function deleteStorageSnapshot(id) {
    await deleteRecord('storageSnapshots', id);
}

// Settings
export async function getSetting(key) {
    const setting = await readRecord('settings', key);
    return setting ? setting.value : null;
}

export async function setSetting(key, value) {
    const setting = {
        key,
        value
    };
    
    await updateRecord('settings', setting);
    return setting;
}

export async function getAllSettings() {
    const settings = await readAllRecords('settings');
    const result = {};
    for (const setting of settings) {
        result[setting.key] = setting.value;
    }
    return result;
}

export async function deleteSetting(key) {
    await deleteRecord('settings', key);
}