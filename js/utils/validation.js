// Validation utility functions
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

export function isMinLength(value, length) {
    return value && value.length >= length;
}

export function isMaxLength(value, length) {
    return value && value.length <= length;
}

export function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

export function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function validateHabit(habit) {
    const errors = {};
    
    if (!isRequired(habit.name)) {
        errors.name = 'Name is required';
    }
    
    if (habit.target && !isValidNumber(habit.target)) {
        errors.target = 'Target must be a number';
    }
    
    return errors;
}

export function validateProject(project) {
    const errors = {};
    
    if (!isRequired(project.name)) {
        errors.name = 'Name is required';
    }
    
    return errors;
}

export function validateGoal(goal) {
    const errors = {};
    
    if (!isRequired(goal.title)) {
        errors.title = 'Title is required';
    }
    
    if (goal.targetDate && !isValidDate(new Date(goal.targetDate))) {
        errors.targetDate = 'Invalid date';
    }
    
    return errors;
}