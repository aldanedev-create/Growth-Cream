// Simple hash-based router
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = 'dashboard';
        
        window.addEventListener('hashchange', () => this.handleRoute());
    }
    
    addRoute(name, handler) {
        this.routes.set(name, handler);
    }
    
    navigate(name, params = {}) {
        const hash = `#${name}`;
        if (window.location.hash === hash) {
            this.handleRoute();
        } else {
            window.location.hash = hash;
        }
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        const routeName = hash.split('?')[0];
        
        // Parse query params
        const queryString = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryString);
        
        const handler = this.routes.get(routeName);
        
        if (handler) {
            this.currentRoute = routeName;
            handler(Object.fromEntries(params));
        } else {
            console.error(`Route not found: ${routeName}`);
            this.navigate(this.defaultRoute);
        }
    }
    
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    init() {
        if (!window.location.hash) {
            window.location.hash = this.defaultRoute;
        } else {
            this.handleRoute();
        }
    }
}

export const router = new Router();