// Date utility functions
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

export function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

export function getDateISO(date) {
    return new Date(date).toISOString().split('T')[0];
}

export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function differenceInDays(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isToday(date) {
    return getDateISO(date) === getTodayISO();
}

export function isFuture(date) {
    return new Date(date) > new Date();
}

export function isPast(date) {
    return new Date(date) < new Date();
}

export function getDayStart(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getDayEnd(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function getWeekDates(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
        dates.push(addDays(monday, i));
    }
    return dates;
}

export function getMonthDates(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
    }
    return dates;
}

export function getRelativeTime(date) {
    const now = new Date();
    const diff = differenceInDays(now, date);
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
    return `${Math.floor(diff / 365)} years ago`;
}