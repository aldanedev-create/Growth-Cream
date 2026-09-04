// Formatting utility functions
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPercentage(value, decimals = 0) {
    return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

export function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}