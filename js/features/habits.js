import { 
    createHabit, 
    getAllHabits, 
    updateHabit, 
    deleteHabit, 
    toggleCompletion,
    getCompletionsForHabit,
    getAllCompletions
} from '../db/habits-db.js';
import { calculateCurrentStreak, calculateLongestStreak, calculateCompletionRate, getWeeklyProgress } from '../services/streak-calculator.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { sparks } from '../components/sparks.js';
import { formatDate, getTodayISO, addDays, getDateISO } from '../utils/dates.js';

let currentDate = getTodayISO();

export async function renderHabits(container) {
    container.innerHTML = `
        <div class="habits-container">
            <div class="section-header">
                <h2 class="section-title">🌱 Habits</h2>
                <div class="habit-actions">
                    <button class="btn btn-primary" id="new-habit-btn">
                        <span>+</span> New Habit
                    </button>
                </div>
            </div>
            
            <div class="date-navigator">
                <button class="btn btn-icon" id="prev-day-btn" aria-label="Previous day">←</button>
                <span id="current-date-display" class="date-display">${formatDate(currentDate)}</span>
                <button class="btn btn-icon" id="next-day-btn" aria-label="Next day">→</button>
                <button class="btn" id="today-btn">Today</button>
            </div>
            
            <div id="habits-list" class="habits-list">
                <!-- Habits will be rendered here -->
            </div>
            
            <div id="weekly-progress" class="weekly-progress card">
                <h3 class="card-title">Weekly Progress</h3>
                <div id="weekly-chart" class="chart-container">
                    <!-- Chart will be rendered here -->
                </div>
            </div>
        </div>
    `;
    
    await loadHabits();
    setupEventListeners();
}

async function loadHabits() {
    const habits = await getAllHabits();
    const completions = await getAllCompletions();
    const habitsList = document.getElementById('habits-list');
    
    if (!habitsList) return;
    
    if (habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌱</div>
                <div class="empty-state-title">No habits yet</div>
                <div class="empty-state-text">Create your first habit to start growing!</div>
                <button class="btn btn-primary" onclick="document.getElementById('new-habit-btn').click()">
                    Create your first habit →
                </button>
            </div>
        `;
    } else {
        habitsList.innerHTML = habits.map(habit => {
            const habitCompletions = completions.filter(c => c.habitId === habit.id);
            const currentStreak = calculateCurrentStreak(habitCompletions);
            const longestStreak = calculateLongestStreak(habitCompletions);
            const completionRate = calculateCompletionRate(habitCompletions);
            const isCompletedToday = habitCompletions.some(c => c.date === currentDate);
            
            return `
                <div class="habit-card card" data-habit-id="${habit.id}">
                    <div class="habit-main">
                        <div class="habit-info">
                            <span class="habit-icon">${habit.icon || '🌱'}</span>
                            <div class="habit-details">
                                <h3 class="habit-name">${habit.name}</h3>
                                ${habit.description ? `<p class="habit-description">${habit.description}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="habit-stats">
                            <div class="stat">
                                <span class="stat-label">Streak</span>
                                <span class="stat-value">🔥 ${currentStreak} days</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Best</span>
                                <span class="stat-value">⭐ ${longestStreak} days</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">30-day rate</span>
                                <span class="stat-value">${completionRate.toFixed(0)}%</span>
                            </div>
                        </div>
                        
                        <div class="habit-actions">
                            <button class="btn btn-icon complete-btn ${isCompletedToday ? 'completed' : ''}" 
                                    data-habit-id="${habit.id}" 
                                    aria-label="${isCompletedToday ? 'Undo completion' : 'Mark complete'}">
                                ${isCompletedToday ? '✓' : '○'}
                            </button>
                            <button class="btn btn-icon edit-habit-btn" data-habit-id="${habit.id}" aria-label="Edit habit">
                                ✏️
                            </button>
                            <button class="btn btn-icon delete-habit-btn" data-habit-id="${habit.id}" aria-label="Delete habit">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach event listeners to habit cards
        attachHabitListeners();
    }
    
    // Update date display
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = formatDate(currentDate);
    }
    
    // Render weekly chart
    await renderWeeklyChart(completions);
}

function attachHabitListeners() {
    // Complete/undo buttons
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const habitId = btn.dataset.habitId;
            const completion = await toggleCompletion(habitId, currentDate);
            
            if (completion) {
                toast.success('Habit completed!');
                sparks.burst(e.clientX, e.clientY, 5);
            } else {
                toast.info('Completion undone');
            }
            
            await loadHabits();
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-habit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const habitId = btn.dataset.habitId;
            const habit = (await getAllHabits()).find(h => h.id === habitId);
            if (habit) {
                showEditHabitModal(habit);
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-habit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const habitId = btn.dataset.habitId;
            const habit = (await getAllHabits()).find(h => h.id === habitId);
            if (habit) {
                showDeleteConfirmation(habit);
            }
        });
    });
}

function setupEventListeners() {
    const newHabitBtn = document.getElementById('new-habit-btn');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const todayBtn = document.getElementById('today-btn');
    
    if (newHabitBtn) {
        newHabitBtn.addEventListener('click', () => showNewHabitModal());
    }
    
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => {
            currentDate = getDateISO(addDays(new Date(currentDate), -1));
            loadHabits();
        });
    }
    
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => {
            currentDate = getDateISO(addDays(new Date(currentDate), 1));
            loadHabits();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = getTodayISO();
            loadHabits();
        });
    }
}

function showNewHabitModal() {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="habit-name">Habit Name</label>
            <input class="form-input" type="text" id="habit-name" required placeholder="e.g., Drink water, Exercise, Read">
        </div>
        <div class="form-group">
            <label class="form-label" for="habit-description">Description</label>
            <textarea class="form-textarea" id="habit-description" placeholder="Optional description"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="habit-frequency">Frequency</label>
            <select class="form-select" id="habit-frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="habit-target">Daily Target</label>
            <input class="form-input" type="number" id="habit-target" value="1" min="1">
        </div>
        <div class="form-group">
            <label class="form-label" for="habit-icon">Icon</label>
            <input class="form-input" type="text" id="habit-icon" value="🌱" placeholder="Emoji icon">
        </div>
    `;
    
    modal.open({
        title: 'Create New Habit',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Create Habit',
                type: 'btn-primary',
                onClick: async () => {
                    const name = form.querySelector('#habit-name').value;
                    const description = form.querySelector('#habit-description').value;
                    const frequency = form.querySelector('#habit-frequency').value;
                    const target = parseInt(form.querySelector('#habit-target').value);
                    const icon = form.querySelector('#habit-icon').value;
                    
                    if (!name) {
                        toast.error('Please enter a habit name');
                        return;
                    }
                    
                    await createHabit({
                        name,
                        description,
                        frequency,
                        target,
                        icon
                    });
                    
                    toast.success('Habit created!');
                    sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
                    await loadHabits();
                }
            }
        ]
    });
}

function showEditHabitModal(habit) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-habit-name">Habit Name</label>
            <input class="form-input" type="text" id="edit-habit-name" value="${habit.name}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-habit-description">Description</label>
            <textarea class="form-textarea" id="edit-habit-description">${habit.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-habit-frequency">Frequency</label>
            <select class="form-select" id="edit-habit-frequency">
                <option value="daily" ${habit.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${habit.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="custom" ${habit.frequency === 'custom' ? 'selected' : ''}>Custom</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-habit-target">Daily Target</label>
            <input class="form-input" type="number" id="edit-habit-target" value="${habit.target || 1}" min="1">
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-habit-icon">Icon</label>
            <input class="form-input" type="text" id="edit-habit-icon" value="${habit.icon || '🌱'}" placeholder="Emoji icon">
        </div>
    `;
    
    modal.open({
        title: 'Edit Habit',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Save Changes',
                type: 'btn-primary',
                onClick: async () => {
                    const name = form.querySelector('#edit-habit-name').value;
                    const description = form.querySelector('#edit-habit-description').value;
                    const frequency = form.querySelector('#edit-habit-frequency').value;
                    const target = parseInt(form.querySelector('#edit-habit-target').value);
                    const icon = form.querySelector('#edit-habit-icon').value;
                    
                    if (!name) {
                        toast.error('Please enter a habit name');
                        return;
                    }
                    
                    await updateHabit(habit.id, {
                        name,
                        description,
                        frequency,
                        target,
                        icon
                    });
                    
                    toast.success('Habit updated!');
                    await loadHabits();
                }
            }
        ]
    });
}

function showDeleteConfirmation(habit) {
    modal.open({
        title: 'Delete Habit',
        content: `<p>Are you sure you want to delete "<strong>${habit.name}</strong>"? This will also delete all completion history.</p>`,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Delete',
                type: 'btn-danger',
                onClick: async () => {
                    await deleteHabit(habit.id);
                    toast.success('Habit deleted');
                    await loadHabits();
                }
            }
        ]
    });
}

async function renderWeeklyChart(completions) {
    const chartContainer = document.getElementById('weekly-chart');
    if (!chartContainer) return;
    
    const weeklyProgress = getWeeklyProgress(completions);
    
    // Simple bar chart using divs
    const maxCount = Math.max(...weeklyProgress.counts, 1);
    
    chartContainer.innerHTML = `
        <div class="bar-chart">
            ${weeklyProgress.counts.map((count, index) => {
                const height = (count / maxCount) * 100;
                const date = new Date(weeklyProgress.dates[index]);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = weeklyProgress.dates[index] === getTodayISO();
                
                return `
                    <div class="bar-item ${isToday ? 'today' : ''}">
                        <div class="bar" style="height: ${height}%">
                            ${count > 0 ? `<span class="bar-value">${count}</span>` : ''}
                        </div>
                        <span class="bar-label">${dayName}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}