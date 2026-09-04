import { createRecord, readRecord, readAllRecords, updateRecord, deleteRecord, generateId } from './database.js';
import { isPast } from '../utils/dates.js';

export async function createGoal(goalData) {
    const goal = {
        id: await generateId(),
        title: goalData.title,
        description: goalData.description || '',
        targetDate: goalData.targetDate || null,
        progress: goalData.progress || 0,
        completed: goalData.completed || false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    await createRecord('goals', goal);
    return goal;
}

export async function getGoal(id) {
    return await readRecord('goals', id);
}

export async function getAllGoals() {
    return await readAllRecords('goals');
}

export async function updateGoal(id, updates) {
    const goal = await getGoal(id);
    if (!goal) {
        throw new Error('Goal not found');
    }
    
    const updatedGoal = {
        ...goal,
        ...updates,
        id: goal.id
    };
    
    if (updates.completed && !goal.completed) {
        updatedGoal.completedAt = new Date().toISOString();
        updatedGoal.progress = 100;
    } else if (updates.completed === false) {
        updatedGoal.completedAt = null;
    }
    
    if (updates.progress === 100) {
        updatedGoal.completed = true;
        updatedGoal.completedAt = new Date().toISOString();
    }
    
    await updateRecord('goals', updatedGoal);
    return updatedGoal;
}

export async function deleteGoal(id) {
    await deleteRecord('goals', id);
}

export async function getActiveGoals() {
    const goals = await getAllGoals();
    return goals.filter(g => !g.completed);
}

export async function getCompletedGoals() {
    const goals = await getAllGoals();
    return goals.filter(g => g.completed);
}

export async function getExpiredGoals() {
    const goals = await getAllGoals();
    return goals.filter(g => !g.completed && g.targetDate && isPast(new Date(g.targetDate)));
}

export async function getDaysRemaining(goal) {
    if (!goal.targetDate || goal.completed) return null;
    
    const target = new Date(goal.targetDate);
    const now = new Date();
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}