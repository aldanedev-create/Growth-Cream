import { getAllSettings, setSetting, getSetting } from '../db/storage-db.js';
import { getAllHabits, getAllCompletions } from '../db/habits-db.js';
import { getAllProjects, getAllTasks } from '../db/projects-db.js';
import { getAllGoals } from '../db/goals-db.js';
import { getAllStorageDevices, getAllStorageSnapshots } from '../db/storage-db.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { downloadText } from '../utils/download.js';
import { clearStore } from '../db/database.js';

export async function renderSettings(container) {
    const settings = await getAllSettings();
    const theme = settings.theme || 'dark';
    
    container.innerHTML = `
        <div class="settings-container">
            <div class="section-header">
                <h2 class="section-title">⚙ Settings</h2>
            </div>
            
            <div class="settings-sections">
                <div class="settings-section card">
                    <h3>Appearance</h3>
                    <div class="form-group">
                        <label class="form-label">Theme</label>
                        <select class="form-select" id="theme-select">
                            <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="system" ${theme === 'system' ? 'selected' : ''}>System Preference</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section card">
                    <h3>Data Management</h3>
                    <div class="button-group">
                        <button class="btn" id="export-data-btn">📤 Export Data</button>
                        <button class="btn" id="import-data-btn">📥 Import Data</button>
                        <button class="btn btn-danger" id="clear-data-btn">🗑 Clear All Data</button>
                    </div>
                </div>
                
                <div class="settings-section card">
                    <h3>PWA Information</h3>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="info-label">Install Status</span>
                            <span class="info-value" id="install-status">Checking...</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Service Worker</span>
                            <span class="info-value" id="sw-status">Checking...</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Storage Usage</span>
                            <span class="info-value" id="storage-usage">Calculating...</span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section card">
                    <h3>About</h3>
                    <p>Growth Cream v1.0.0</p>
                    <p>A local-first productivity and utility PWA.</p>
                    <p class="text-muted">All data is stored locally in your browser.</p>
                </div>
            </div>
        </div>
    `;
    
    setupEventListeners();
    checkPWAStatus();
}

function setupEventListeners() {
    // Theme selection
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', async () => {
            const theme = themeSelect.value;
            await setSetting('theme', theme);
            applyTheme(theme);
            toast.success('Theme updated!');
        });
    }
    
    // Export data
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Import data
    const importBtn = document.getElementById('import-data-btn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    // Clear data
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', showClearDataConfirmation);
    }
}

function applyTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

async function checkPWAStatus() {
    // Install status
    const installStatus = document.getElementById('install-status');
    if (installStatus) {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            installStatus.textContent = '✅ Installed';
        } else {
            installStatus.textContent = '📱 Can be installed';
        }
    }
    
    // Service worker status
    const swStatus = document.getElementById('sw-status');
    if (swStatus) {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            swStatus.textContent = registration ? '✅ Active' : '❌ Not registered';
        } else {
            swStatus.textContent = '❌ Not supported';
        }
    }
    
    // Storage usage
    const storageUsage = document.getElementById('storage-usage');
    if (storageUsage) {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
            const totalMB = (estimate.quota / (1024 * 1024)).toFixed(1);
            storageUsage.textContent = `${usedMB} MB / ${totalMB} MB`;
        } else {
            storageUsage.textContent = 'Not available';
        }
    }
}

async function exportData() {
    try {
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            habits: await getAllHabits(),
            habitCompletions: await getAllCompletions(),
            projects: await getAllProjects(),
            tasks: await getAllTasks(),
            goals: await getAllGoals(),
            storageDevices: await getAllStorageDevices(),
            storageSnapshots: await getAllStorageSnapshots(),
            settings: await getAllSettings()
        };
        
        const json = JSON.stringify(data, null, 2);
        downloadText(json, `growth-cream-export-${new Date().toISOString().split('T')[0]}.json`);
        toast.success('Data exported successfully!');
    } catch (error) {
        console.error('Export failed:', error);
        toast.error('Failed to export data');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate schema
            if (!validateImportData(data)) {
                toast.error('Invalid data format');
                return;
            }
            
            showImportConfirmation(data);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Failed to import data: ' + error.message);
        }
    };
    input.click();
}

function validateImportData(data) {
    return data && 
           typeof data === 'object' &&
           Array.isArray(data.habits) &&
           Array.isArray(data.projects) &&
           Array.isArray(data.goals);
}

function showImportConfirmation(data) {
    modal.open({
        title: 'Import Data',
        content: `
            <p>This will import:</p>
            <ul>
                <li>${data.habits?.length || 0} habits</li>
                <li>${data.habitCompletions?.length || 0} habit completions</li>
                <li>${data.projects?.length || 0} projects</li>
                <li>${data.tasks?.length || 0} tasks</li>
                <li>${data.goals?.length || 0} goals</li>
            </ul>
            <p><strong>Warning:</strong> This will merge with existing data. Duplicate IDs will be updated.</p>
        `,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Import',
                type: 'btn-primary',
                onClick: async () => {
                    await performImport(data);
                }
            }
        ]
    });
}

async function performImport(data) {
    try {
        // Import all stores
        const stores = [
            ['habits', data.habits || []],
            ['habitCompletions', data.habitCompletions || []],
            ['projects', data.projects || []],
            ['tasks', data.tasks || []],
            ['goals', data.goals || []],
            ['storageDevices', data.storageDevices || []],
            ['storageSnapshots', data.storageSnapshots || []]
        ];
        
        for (const [storeName, records] of stores) {
            for (const record of records) {
                await updateRecord(storeName, record);
            }
        }
        
        // Import settings
        if (data.settings) {
            for (const [key, value] of Object.entries(data.settings)) {
                await setSetting(key, value);
            }
        }
        
        toast.success('Data imported successfully!');
    } catch (error) {
        console.error('Import failed:', error);
        toast.error('Failed to import data');
    }
}

function showClearDataConfirmation() {
    modal.open({
        title: 'Clear All Data',
        content: `
            <p><strong>Warning:</strong> This will permanently delete all your data including:</p>
            <ul>
                <li>Habits and completions</li>
                <li>Projects and tasks</li>
                <li>Goals</li>
                <li>Storage tracking data</li>
                <li>Settings</li>
            </ul>
            <p>This action cannot be undone!</p>
        `,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Clear Everything',
                type: 'btn-danger',
                onClick: async () => {
                    await clearAllData();
                }
            }
        ]
    });
}

async function clearAllData() {
    try {
        const stores = [
            'habits',
            'habitCompletions',
            'projects',
            'tasks',
            'goals',
            'notes',
            'images',
            'imageJobs',
            'storageDevices',
            'storageSnapshots',
            'settings'
        ];
        
        for (const store of stores) {
            await clearStore(store);
        }
        
        toast.success('All data cleared');
        
        // Reload app
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Failed to clear data');
    }
}