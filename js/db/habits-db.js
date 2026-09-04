import { createRecord, readRecord, readAllRecords, updateRecord, deleteRecord, getByIndex, generateId } from './database.js';

export async function createHabit(habitData) {
    const habit = {
        id: await generateId(),
        name: habitData.name,
        description: habitData.description || '',
        frequency: habitData.frequency || 'daily',
        target: habitData.target || 1,
        color: habitData.color || '#ff2bd6',
        icon: habitData.icon || '🌱',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await createRecord('habits', habit);
    return habit;
}

export async function getHabit(id) {
    return await readRecord('habits', id);
}

export async function getAllHabits() {
    return await readAllRecords('habits');
}

export async function updateHabit(id, updates) {
    const habit = await getHabit(id);
    if (!habit) {
        throw new Error('Habit not found');
    }
    
    const updatedHabit = {
        ...habit,
        ...updates,
        id: habit.id,
        updatedAt: new Date().toISOString()
    };
    
    await updateRecord('habits', updatedHabit);
    return updatedHabit;
}

export async function deleteHabit(id) {
    await deleteRecord('habits', id);
    
    // Also delete all completions for this habit
    const completions = await getByIndex('habitCompletions', 'habitId', id);
    for (const completion of completions) {
        await deleteRecord('habitCompletions', completion.id);
    }
}

// Habit completions
export async function createCompletion(habitId, date) {
    const completion = {
        id: await generateId(),
        habitId,
        date: date || new Date().toISOString().split('T')[0],
        completedAt: new Date().toISOString()
    };
    
    await createRecord('habitCompletions', completion);
    return completion;
}

export async function getCompletion(id) {
    return await readRecord('habitCompletions', id);
}

export async function getAllCompletions() {
    return await readAllRecords('habitCompletions');
}

export async function getCompletionsForHabit(habitId) {
    return await getByIndex('habitCompletions', 'habitId', habitId);
}

export async function getCompletionsForDate(date) {
    return await getByIndex('habitCompletions', 'date', date);
}

export async function deleteCompletion(id) {
    await deleteRecord('habitCompletions', id);
}

export async function getCompletionForHabitAndDate(habitId, date) {
    const completions = await getCompletionsForHabit(habitId);
    return completions.find(c => c.date === date);
}

export async function toggleCompletion(habitId, date) {
    const existing = await getCompletionForHabitAndDate(habitId, date);
    if (existing) {
        await deleteCompletion(existing.id);
        return null;
    } else {
        return await createCompletion(habitId, date);
    }
}