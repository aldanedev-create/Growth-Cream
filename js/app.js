import { router } from './router.js';
import { openDatabase } from './db/database.js';
import { renderNavbar } from './components/navbar.js';
import { renderDashboard } from './features/dashboard.js';
import { renderHabits } from './features/habits.js';
import { renderProjects } from './features/projects.js';
import { renderGoals } from './features/goals.js';
import { renderImageStudio } from './features/image-studio.js';
import { renderStorageTracker } from './features/storage-tracker.js';
import { renderSettings } from './features/settings.js';
import { toast } from './components/toast.js';

// Initialize application
async function initApp() {
    try {
        // Open database
        await openDatabase();
        console.log('Database initialized');
        
        // Setup router
        setupRouter();
        
        // Render navbar
        renderNavbar();
        
        // Register service worker
        registerServiceWorker();
        
        // Initialize router
        router.init();
        
        console.log('Growth Cream initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to initialize application');
    }
}

function setupRouter() {
    const container = document.getElementById('page-container');
    
    router.addRoute('dashboard', async () => {
        await renderDashboard(container);
        renderNavbar();
    });
    
    router.addRoute('habits', async () => {
        await renderHabits(container);
        renderNavbar();
    });
    
    router.addRoute('projects', async () => {
        await renderProjects(container);
        renderNavbar();
    });
    
    router.addRoute('goals', async () => {
        await renderGoals(container);
        renderNavbar();
    });
    
    router.addRoute('image-studio', async () => {
        await renderImageStudio(container);
        renderNavbar();
    });
    
    router.addRoute('storage', async () => {
        await renderStorageTracker(container);
        renderNavbar();
    });
    
    router.addRoute('settings', async () => {
        await renderSettings(container);
        renderNavbar();
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    // No special handling needed for now
});

// Handle online/offline events
window.addEventListener('online', () => {
    toast.success('Back online!');
});

window.addEventListener('offline', () => {
    toast.warning('You are offline. App will continue to work.');
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});