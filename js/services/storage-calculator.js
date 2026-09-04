import { formatBytes } from '../utils/format.js';

export function calculateStorageUsage(snapshots) {
    if (!snapshots || snapshots.length === 0) return null;
    
    const sorted = snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return sorted[0];
}

export function calculateStorageVelocity(snapshots) {
    if (!snapshots || snapshots.length < 2) return null;
    
    const sorted = snapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const usedBytesDiff = last.usedBytes - first.usedBytes;
    const timeDiffMs = new Date(last.timestamp) - new Date(first.timestamp);
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);
    
    if (timeDiffDays === 0) return null;
    
    const bytesPerDay = usedBytesDiff / timeDiffDays;
    const bytesPerWeek = bytesPerDay * 7;
    const bytesPerMonth = bytesPerDay * 30;
    
    return {
        bytesPerDay,
        bytesPerWeek,
        bytesPerMonth,
        daysTracked: timeDiffDays
    };
}

export function calculateEstimatedFillDate(latestSnapshot, velocity) {
    if (!latestSnapshot || !velocity || velocity.bytesPerDay <= 0) return null;
    
    const freeBytes = latestSnapshot.freeBytes || (latestSnapshot.totalBytes - latestSnapshot.usedBytes);
    if (freeBytes <= 0) return null;
    
    const daysUntilFull = freeBytes / velocity.bytesPerDay;
    
    if (daysUntilFull > 3650) return null; // More than 10 years
    
    const fillDate = new Date();
    fillDate.setDate(fillDate.getDate() + daysUntilFull);
    
    return fillDate;
}

export function calculateStorageGrowthPercentage(snapshots) {
    if (!snapshots || snapshots.length < 2) return 0;
    
    const sorted = snapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    if (first.usedBytes === 0) return last.usedBytes > 0 ? 100 : 0;
    
    return ((last.usedBytes - first.usedBytes) / first.usedBytes) * 100;
}

export function getStorageStatus(device) {
    if (!device) return 'unknown';
    
    const usedPercentage = device.totalBytes > 0 
        ? (device.usedBytes / device.totalBytes) * 100 
        : 0;
    
    if (usedPercentage >= 90) return 'critical';
    if (usedPercentage >= 75) return 'warning';
    return 'healthy';
}

export function formatStorageSummary(device) {
    return {
        total: formatBytes(device.totalBytes),
        used: formatBytes(device.usedBytes),
        free: formatBytes(device.freeBytes || (device.totalBytes - device.usedBytes)),
        usedPercentage: device.totalBytes > 0 
            ? (device.usedBytes / device.totalBytes) * 100 
            : 0
    };
}