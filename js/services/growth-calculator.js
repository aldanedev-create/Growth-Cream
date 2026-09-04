// Pure calculation functions for growth metrics
import { calculateCurrentStreak, calculateLongestStreak, calculateCompletionRate } from './streak-calculator.js';

export function calculatePersonalGrowthScore(habits, completions) {
    if (!habits || habits.length === 0) return 0;
    
    const totalCompletionRate = habits.reduce((sum, habit) => {
        const habitCompletions = completions.filter(c => c.habitId === habit.id);
        return sum + calculateCompletionRate(habitCompletions);
    }, 0);
    
    return totalCompletionRate / habits.length;
}

export function calculateProjectGrowthScore(projects, tasks) {
    if (!projects || projects.length === 0) return 0;
    
    const totalProgress = projects.reduce((sum, project) => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        if (projectTasks.length === 0) return sum + (project.progress || 0);
        
        const completedTasks = projectTasks.filter(t => t.completed);
        const taskProgress = (completedTasks.length / projectTasks.length) * 100;
        return sum + taskProgress;
    }, 0);
    
    return totalProgress / projects.length;
}

export function calculateGoalsGrowthScore(goals) {
    if (!goals || goals.length === 0) return 0;
    
    const totalProgress = goals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
    return totalProgress / goals.length;
}

export function calculateOverallGrowthScore(habits, completions, projects, tasks, goals) {
    const personalScore = calculatePersonalGrowthScore(habits, completions);
    const projectScore = calculateProjectGrowthScore(projects, tasks);
    const goalsScore = calculateGoalsGrowthScore(goals);
    
    // Weighted average
    return (personalScore * 0.4 + projectScore * 0.35 + goalsScore * 0.25);
}

export function calculateGrowthTrend(historicalData) {
    if (!historicalData || historicalData.length < 2) return 0;
    
    const sorted = [...historicalData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstScore = sorted[0].score;
    const lastScore = sorted[sorted.length - 1].score;
    
    return lastScore - firstScore;
}

export function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

export function estimateTimeToComplete(currentProgress, targetProgress, dailyRate) {
    if (dailyRate <= 0) return null;
    if (currentProgress >= targetProgress) return 0;
    
    const remaining = targetProgress - currentProgress;
    return Math.ceil(remaining / dailyRate);
}

export function calculateHabitCompletionTrend(completions, days = 7) {
    if (!completions || completions.length === 0) return [];
    
    const today = new Date();
    const trend = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateISO = date.toISOString().split('T')[0];
        const count = completions.filter(c => c.date === dateISO).length;
        trend.push({
            date: dateISO,
            count
        });
    }
    
    return trend;
}