import { 
    createStorageDevice, 
    getAllStorageDevices, 
    updateStorageDevice, 
    deleteStorageDevice,
    createStorageSnapshot,
    getSnapshotsForDevice,
    getAllStorageSnapshots
} from '../db/storage-db.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { sparks } from '../components/sparks.js';
import { 
    calculateStorageUsage, 
    calculateStorageVelocity, 
    calculateEstimatedFillDate,
    formatStorageSummary,
    getStorageStatus
} from '../services/storage-calculator.js';
import { formatBytes } from '../utils/format.js';
import { formatDate, formatDateTime } from '../utils/dates.js';

let selectedDeviceId = null;

export async function renderStorageTracker(container) {
    container.innerHTML = `
        <div class="storage-container">
            <div class="section-header">
                <h2 class="section-title">💾 Storage Growth</h2>
                <button class="btn btn-primary" id="new-device-btn">
                    <span>+</span> Add Storage
                </button>
            </div>
            
            <div class="storage-info-banner">
                <p>
                    <strong>ℹ️ About Storage Tracking:</strong> 
                    This feature can only analyze browser storage and files/directories you explicitly grant access to. 
                    It cannot scan your entire device without permission.
                </p>
            </div>
            
            <div class="storage-layout">
                <div class="storage-devices" id="storage-devices">
                    <!-- Storage devices will be listed here -->
                </div>
                
                <div class="storage-details" id="storage-details">
                    <!-- Selected device details will be shown here -->
                </div>
            </div>
        </div>
    `;
    
    await loadStorageDevices();
    setupEventListeners();
}

async function loadStorageDevices() {
    const devices = await getAllStorageDevices();
    const container = document.getElementById('storage-devices');
    
    if (!container) return;
    
    if (devices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💾</div>
                <div class="empty-state-title">No storage tracked</div>
                <div class="empty-state-text">Add a storage target to start tracking growth</div>
                <button class="btn btn-primary" onclick="document.getElementById('new-device-btn').click()">
                    Add your first storage →
                </button>
            </div>
        `;
    } else {
        container.innerHTML = devices.map(device => {
            const summary = formatStorageSummary(device);
            const status = getStorageStatus(device);
            
            return `
                <div class="storage-card card ${device.id === selectedDeviceId ? 'selected' : ''}" data-device-id="${device.id}">
                    <div class="storage-card-header">
                        <h3>${device.name}</h3>
                        <span class="badge ${status === 'healthy' ? 'badge-success' : status === 'warning' ? 'badge-warning' : ''}">
                            ${status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </div>
                    
                    <div class="storage-progress">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${summary.usedPercentage}%"></div>
                        </div>
                        <span class="progress-text">${summary.usedPercentage.toFixed(1)}% used</span>
                    </div>
                    
                    <div class="storage-metrics">
                        <div class="metric">
                            <span class="metric-label">Used</span>
                            <span class="metric-value">${summary.used}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Free</span>
                            <span class="metric-value">${summary.free}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total</span>
                            <span class="metric-value">${summary.total}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach click listeners
        container.querySelectorAll('.storage-card').forEach(card => {
            card.addEventListener('click', () => {
                selectedDeviceId = card.dataset.deviceId;
                loadStorageDevices();
                showDeviceDetails(selectedDeviceId);
            });
        });
    }
}

async function showDeviceDetails(deviceId) {
    const detailsContainer = document.getElementById('storage-details');
    if (!detailsContainer) return;
    
    const devices = await getAllStorageDevices();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    
    const snapshots = await getSnapshotsForDevice(deviceId);
    const summary = formatStorageSummary(device);
    const velocity = calculateStorageVelocity(snapshots);
    const fillDate = calculateEstimatedFillDate(snapshots[snapshots.length - 1], velocity);
    
    detailsContainer.innerHTML = `
        <div class="device-details-card card">
            <div class="device-details-header">
                <h2>${device.name}</h2>
                <div class="device-actions">
                    <button class="btn btn-icon refresh-device-btn" aria-label="Refresh">🔄</button>
                    <button class="btn btn-icon edit-device-btn" aria-label="Edit">✏️</button>
                    <button class="btn btn-icon delete-device-btn" aria-label="Delete">🗑️</button>
                </div>
            </div>
            
            <div class="device-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Space</span>
                    <span class="summary-value">${summary.total}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Used Space</span>
                    <span class="summary-value">${summary.used}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Free Space</span>
                    <span class="summary-value">${summary.free}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Usage</span>
                    <span class="summary-value">${summary.usedPercentage.toFixed(1)}%</span>
                </div>
            </div>
            
            <div class="growth-analysis">
                <h3>Growth Analysis</h3>
                ${velocity ? `
                    <div class="growth-stats">
                        <div class="stat">
                            <span class="stat-label">Per Day</span>
                            <span class="stat-value">${formatBytes(velocity.bytesPerDay)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Per Week</span>
                            <span class="stat-value">${formatBytes(velocity.bytesPerWeek)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Per Month</span>
                            <span class="stat-value">${formatBytes(velocity.bytesPerMonth)}</span>
                        </div>
                    </div>
                    ${fillDate ? `
                        <p class="fill-date">
                            Estimated fill date: <strong>${formatDate(fillDate)}</strong>
                        </p>
                    ` : `
                        <p class="no-fill-date">Storage growth is not trending toward filling up.</p>
                    `}
                ` : `
                    <p class="insufficient-data">
                        Not enough history yet. Continue tracking for a few days to calculate your storage growth velocity.
                    </p>
                `}
            </div>
            
            <div class="snapshots-section">
                <h3>Snapshots (${snapshots.length})</h3>
                <button class="btn btn-sm" id="add-snapshot-btn">+ Add Snapshot</button>
                
                <div class="snapshots-list">
                    ${snapshots.length === 0 ? 
                        '<p class="text-muted">No snapshots recorded yet</p>' : 
                        snapshots.slice(-10).reverse().map(snapshot => `
                            <div class="snapshot-item">
                                <span>${formatDateTime(snapshot.timestamp)}</span>
                                <span>${formatBytes(snapshot.usedBytes)} used</span>
                                <span>${formatBytes(snapshot.freeBytes)} free</span>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
    
    attachDeviceDetailsListeners(device);
}

function attachDeviceDetailsListeners(device) {
    const detailsContainer = document.getElementById('storage-details');
    
    // Refresh button
    const refreshBtn = detailsContainer.querySelector('.refresh-device-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await refreshDeviceInfo(device);
            await showDeviceDetails(device.id);
        });
    }
    
    // Edit button
    const editBtn = detailsContainer.querySelector('.edit-device-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => showEditDeviceModal(device));
    }
    
    // Delete button
    const deleteBtn = detailsContainer.querySelector('.delete-device-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => showDeleteDeviceConfirmation(device));
    }
    
    // Add snapshot button
    const addSnapshotBtn = detailsContainer.querySelector('#add-snapshot-btn');
    if (addSnapshotBtn) {
        addSnapshotBtn.addEventListener('click', () => showAddSnapshotModal(device));
    }
}

async function refreshDeviceInfo(device) {
    // Check if File System Access API is available
    if ('showDirectoryPicker' in window) {
        try {
            const directoryHandle = await window.showDirectoryPicker();
            const info = await analyzeDirectory(directoryHandle);
            
            await updateStorageDevice(device.id, {
                totalBytes: info.totalBytes,
                usedBytes: info.usedBytes,
                freeBytes: info.freeBytes
            });
            
            await createStorageSnapshot({
                deviceId: device.id,
                totalBytes: info.totalBytes,
                usedBytes: info.usedBytes,
                freeBytes: info.freeBytes
            });
            
            toast.success('Storage info updated!');
            sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
        } catch (error) {
            if (error.name === 'AbortError') {
                toast.info('Directory selection cancelled');
            } else {
                toast.error('Failed to analyze directory: ' + error.message);
            }
        }
    } else {
        // Fallback: Show browser storage info
        toast.info('File System Access API not supported. Showing browser storage info instead.');
        showBrowserStorageInfo(device);
    }
}

async function analyzeDirectory(directoryHandle) {
    let totalBytes = 0;
    
    async function processEntry(handle) {
        if (handle.kind === 'file') {
            const file = await handle.getFile();
            totalBytes += file.size;
        } else if (handle.kind === 'directory') {
            for await (const entry of handle.values()) {
                await processEntry(entry);
            }
        }
    }
    
    await processEntry(directoryHandle);
    
    return {
        totalBytes,
        usedBytes: totalBytes,
        freeBytes: 0
    };
}

function showBrowserStorageInfo(device) {
    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(async (estimate) => {
            const totalBytes = estimate.quota || 0;
            const usedBytes = estimate.usage || 0;
            const freeBytes = totalBytes - usedBytes;
            
            await updateStorageDevice(device.id, {
                totalBytes,
                usedBytes,
                freeBytes
            });
            
            await createStorageSnapshot({
                deviceId: device.id,
                totalBytes,
                usedBytes,
                freeBytes
            });
            
            toast.success('Browser storage info updated!');
            await showDeviceDetails(device.id);
        }).catch(error => {
            toast.error('Failed to get browser storage info: ' + error.message);
        });
    } else {
        toast.error('Storage estimation API not supported');
    }
}

function setupEventListeners() {
    const newDeviceBtn = document.getElementById('new-device-btn');
    if (newDeviceBtn) {
        newDeviceBtn.addEventListener('click', () => showNewDeviceModal());
    }
}

function showNewDeviceModal() {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="device-name">Storage Name</label>
            <input class="form-input" type="text" id="device-name" required placeholder="e.g., My Projects, Downloads">
        </div>
        <div class="form-group">
            <label class="form-label" for="device-type">Type</label>
            <select class="form-select" id="device-type">
                <option value="folder">Folder</option>
                <option value="drive">Drive</option>
                <option value="browser">Browser Storage</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="device-total">Total Space (bytes, optional)</label>
            <input class="form-input" type="number" id="device-total" placeholder="Auto-detect">
        </div>
    `;
    
    modal.open({
        title: 'Add Storage',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Add Storage',
                type: 'btn-primary',
                onClick: async () => {
                    const name = form.querySelector('#device-name').value;
                    const type = form.querySelector('#device-type').value;
                    const totalBytes = parseInt(form.querySelector('#device-total').value) || 0;
                    
                    if (!name) {
                        toast.error('Please enter a storage name');
                        return;
                    }
                    
                    const device = await createStorageDevice({
                        name,
                        type,
                        totalBytes
                    });
                    
                    toast.success('Storage added!');
                    selectedDeviceId = device.id;
                    await loadStorageDevices();
                    await showDeviceDetails(device.id);
                }
            }
        ]
    });
}

function showEditDeviceModal(device) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-device-name">Storage Name</label>
            <input class="form-input" type="text" id="edit-device-name" value="${device.name}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-device-type">Type</label>
            <select class="form-select" id="edit-device-type">
                <option value="folder" ${device.type === 'folder' ? 'selected' : ''}>Folder</option>
                <option value="drive" ${device.type === 'drive' ? 'selected' : ''}>Drive</option>
                <option value="browser" ${device.type === 'browser' ? 'selected' : ''}>Browser Storage</option>
            </select>
        </div>
    `;
    
    modal.open({
        title: 'Edit Storage',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Save Changes',
                type: 'btn-primary',
                onClick: async () => {
                    const name = form.querySelector('#edit-device-name').value;
                    const type = form.querySelector('#edit-device-type').value;
                    
                    if (!name) {
                        toast.error('Please enter a storage name');
                        return;
                    }
                    
                    await updateStorageDevice(device.id, { name, type });
                    toast.success('Storage updated!');
                    await loadStorageDevices();
                    await showDeviceDetails(device.id);
                }
            }
        ]
    });
}

function showDeleteDeviceConfirmation(device) {
    modal.open({
        title: 'Delete Storage',
        content: `<p>Are you sure you want to delete "<strong>${device.name}</strong>" and all its snapshots?</p>`,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Delete',
                type: 'btn-danger',
                onClick: async () => {
                    await deleteStorageDevice(device.id);
                    toast.success('Storage deleted');
                    selectedDeviceId = null;
                    await loadStorageDevices();
                    document.getElementById('storage-details').innerHTML = '';
                }
            }
        ]
    });
}

function showAddSnapshotModal(device) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="snapshot-used">Used Space (bytes)</label>
            <input class="form-input" type="number" id="snapshot-used" value="${device.usedBytes || 0}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="snapshot-total">Total Space (bytes)</label>
            <input class="form-input" type="number" id="snapshot-total" value="${device.totalBytes || 0}">
        </div>
    `;
    
    modal.open({
        title: 'Add Snapshot',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Add Snapshot',
                type: 'btn-primary',
                onClick: async () => {
                    const usedBytes = parseInt(form.querySelector('#snapshot-used').value) || 0;
                    const totalBytes = parseInt(form.querySelector('#snapshot-total').value) || 0;
                    const freeBytes = totalBytes - usedBytes;
                    
                    await createStorageSnapshot({
                        deviceId: device.id,
                        usedBytes,
                        totalBytes,
                        freeBytes
                    });
                    
                    await updateStorageDevice(device.id, {
                        usedBytes,
                        totalBytes,
                        freeBytes
                    });
                    
                    toast.success('Snapshot added!');
                    await showDeviceDetails(device.id);
                }
            }
        ]
    });
}