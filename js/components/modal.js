// Modal dialog system
export class Modal {
    constructor() {
        this.container = document.getElementById('modal-container');
        this.modalElement = null;
        this.onClose = null;
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'modal-container';
            document.body.appendChild(this.container);
        }
    }
    
    open({ title, content, actions = [], onClose = null, size = 'medium' }) {
        this.onClose = onClose;
        
        // Remove existing modal
        this.close();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', title);
        modal.style.cssText = `
            background: var(--surface);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-lg);
            padding: 24px;
            max-width: ${this.getModalSize(size)};
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: modalIn 0.3s ease-out;
            box-shadow: var(--shadow-lg);
        `;
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close modal');
        closeButton.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 24px;
            color: var(--text-muted);
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = 'var(--surface-2)';
            closeButton.style.color = 'var(--text)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'none';
            closeButton.style.color = 'var(--text-muted)';
        };
        closeButton.onclick = () => this.close();
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            font-size: var(--font-size-xl);
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--text);
        `;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'modal-content';
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentElement.appendChild(content);
        }
        
        const actionsElement = document.createElement('div');
        actionsElement.className = 'modal-actions';
        actionsElement.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 24px;
        `;
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.label;
            button.className = `btn ${action.type || 'btn-primary'}`;
            button.onclick = async () => {
                if (action.onClick) {
                    await action.onClick();
                }
                if (action.closeOnClick !== false) {
                    this.close();
                }
            };
            actionsElement.appendChild(button);
        });
        
        modal.appendChild(closeButton);
        modal.appendChild(titleElement);
        modal.appendChild(contentElement);
        modal.appendChild(actionsElement);
        
        overlay.appendChild(modal);
        this.container.appendChild(overlay);
        this.modalElement = overlay;
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.close();
            }
        };
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Focus first focusable element
        setTimeout(() => {
            const focusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        }, 100);
    }
    
    getModalSize(size) {
        const sizes = {
            small: '400px',
            medium: '600px',
            large: '800px',
            xlarge: '1000px'
        };
        return sizes[size] || sizes.medium;
    }
    
    close() {
        if (this.modalElement) {
            this.modalElement.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (this.modalElement && this.modalElement.parentElement) {
                    this.modalElement.remove();
                }
                this.modalElement = null;
            }, 200);
            
            if (this.onClose) {
                this.onClose();
            }
        }
    }
}

// Add modal animations
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    @keyframes modalIn {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(modalStyle);

export const modal = new Modal();