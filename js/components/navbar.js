import { router } from '../router.js';

export function renderNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const currentRoute = router.getCurrentRoute() || 'dashboard';
    
    navbar.innerHTML = `
        <div class="navbar-header">
            <div class="navbar-logo">
                <span class="logo-icon">✦</span>
                <span class="logo-text">Growth Cream</span>
            </div>
            <button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle navigation">
                ☰
            </button>
        </div>
        
        <nav class="navbar-nav" id="navbar-nav" aria-label="Main navigation">
            <a href="#dashboard" class="nav-item ${currentRoute === 'dashboard' ? 'active' : ''}" data-route="dashboard">
                <span class="nav-icon">◉</span>
                <span class="nav-label">Dashboard</span>
            </a>
            <a href="#habits" class="nav-item ${currentRoute === 'habits' ? 'active' : ''}" data-route="habits">
                <span class="nav-icon">🌱</span>
                <span class="nav-label">Habits</span>
            </a>
            <a href="#projects" class="nav-item ${currentRoute === 'projects' ? 'active' : ''}" data-route="projects">
                <span class="nav-icon">💻</span>
                <span class="nav-label">DevLog</span>
            </a>
            <a href="#goals" class="nav-item ${currentRoute === 'goals' ? 'active' : ''}" data-route="goals">
                <span class="nav-icon">🎯</span>
                <span class="nav-label">Goals</span>
            </a>
            <a href="#image-studio" class="nav-item ${currentRoute === 'image-studio' ? 'active' : ''}" data-route="image-studio">
                <span class="nav-icon">🖼</span>
                <span class="nav-label">Image Studio</span>
            </a>
            <a href="#storage" class="nav-item ${currentRoute === 'storage' ? 'active' : ''}" data-route="storage">
                <span class="nav-icon">💾</span>
                <span class="nav-label">Storage</span>
            </a>
            <a href="#settings" class="nav-item ${currentRoute === 'settings' ? 'active' : ''}" data-route="settings">
                <span class="nav-icon">⚙</span>
                <span class="nav-label">Settings</span>
            </a>
        </nav>
        
        <div class="navbar-footer">
            <span class="footer-spark">✦</span>
            <span class="footer-text">Keep growing</span>
            <span class="footer-spark">✦</span>
        </div>
    `;
    
    setupNavbarListeners();
}

function setupNavbarListeners() {
    const toggle = document.getElementById('navbar-toggle');
    const nav = document.getElementById('navbar-nav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }
    
    // Close nav on mobile when clicking a link
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                nav.classList.remove('open');
            }
        });
    });
}