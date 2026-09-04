import { getCompletionsForHabit } from '../db/habits-db.js';
import { getDateISO, addDays, differenceInDays } from '../utils/dates.js';

export function calculateCurrentStreak(completions) {
    if (!completions || completions.length === 0) return 0;
    
    // Sort completions by date descending
    const sortedDates = completions
        .map(c => c.date)
        .sort()
        .reverse();
    
    // Get unique dates
    const uniqueDates = [...new Set(sortedDates)];
    
    // Check if today or yesterday is completed
    const today = getDateISO(new Date());
    const yesterday = getDateISO(addDays(new Date(), -1));
    
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }
    
    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const expectedDate = getDateISO(addDays(currentDate, -1));
        if (uniqueDates[i] === expectedDate) {
            streak++;
            currentDate = addDays(currentDate, -1);
        } else {
            break;
        }
    }
    
    return streak;
}

export function calculateLongestStreak(completions) {
    if (!completions || completions.length === 0) return 0;
    
    // Sort completions by date
    const sortedDates = completions
        .map(c => c.date)
        .sort();
    
    // Get unique dates
    const uniqueDates = [...new Set(sortedDates)];
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        
        if (differenceInDays(currDate, prevDate) === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    return longestStreak;
}

export function calculateCompletionRate(completions, days = 30) {
    if (!completions || completions.length === 0) return 0;
    
    const today = new Date();
    const startDate = addDays(today, -days);
    
    const recentCompletions = completions.filter(c => {
        const completionDate = new Date(c.date);
        return completionDate >= startDate && completionDate <= today;
    });
    
    const uniqueDates = new Set(recentCompletions.map(c => c.date));
    
    return (uniqueDates.size / days) * 100;
}

export function getWeeklyProgress(completions) {
    const today = new Date();
    const weekStart = addDays(today, -6);
    
    const weeklyCompletions = {};
    const weekDates = [];
    
    for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dateISO = getDateISO(date);
        weekDates.push(dateISO);
        weeklyCompletions[dateISO] = completions.filter(c => c.date === dateISO).length;
    }
    
    return {
        dates: weekDates,
        counts: weekDates.map(date => weeklyCompletions[date] || 0)
    };
}

export function getMonthlyProgress(completions) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    const monthlyCompletions = {};
    const monthDates = [];
    
    for (let i = 0; i < daysInMonth; i++) {
        const date = addDays(monthStart, i);
        const dateISO = getDateISO(date);
        monthDates.push(dateISO);
        monthlyCompletions[dateISO] = completions.filter(c => c.date === dateISO).length;
    }
    
    return {
        dates: monthDates,
        counts: monthDates.map(date => monthlyCompletions[date] || 0)
    };
}