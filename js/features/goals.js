import { 
    createGoal, 
    getAllGoals, 
    updateGoal, 
    deleteGoal,
    getActiveGoals,
    getCompletedGoals,
    getDaysRemaining
} from '../db/goals-db.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { sparks } from '../components/sparks.js';
import { formatDate, differenceInDays } from '../utils/dates.js';

export async function renderGoals(container) {
    container.innerHTML = `
        <div class="goals-container">
            <div class="section-header">
                <h2 class="section-title">🎯 Goals</h2>
                <button class="btn btn-primary" id="new-goal-btn">
                    <span>+</span> New Goal
                </button>
            </div>
            
            <div class="goals-tabs">
                <button class="btn active" data-tab="active">Active Goals</button>
                <button class="btn" data-tab="completed">Completed Goals</button>
            </div>
            
            <div id="active-goals" class="goals-list">
                <!-- Active goals will be rendered here -->
            </div>
            
            <div id="completed-goals" class="goals-list" style="display: none;">
                <!-- Completed goals will be rendered here -->
            </div>
        </div>
    `;
    
    await loadGoals();
    setupEventListeners();
}

async function loadGoals() {
    const activeGoals = await getActiveGoals();
    const completedGoals = await getCompletedGoals();
    
    const activeContainer = document.getElementById('active-goals');
    const completedContainer = document.getElementById('completed-goals');
    
    if (!activeContainer || !completedContainer) return;
    
    // Render active goals
    if (activeGoals.length === 0) {
        activeContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <div class="empty-state-title">No active goals</div>
                <div class="empty-state-text">Set a goal to start tracking your progress!</div>
                <button class="btn btn-primary" onclick="document.getElementById('new-goal-btn').click()">
                    Set your first goal →
                </button>
            </div>
        `;
    } else {
        activeContainer.innerHTML = activeGoals.map(goal => {
            const daysRemaining = goal.targetDate ? getDaysRemaining(goal) : null;
            const isExpired = daysRemaining !== null && daysRemaining < 0;
            
            return `
                <div class="goal-card card" data-goal-id="${goal.id}">
                    <div class="goal-header">
                        <h3 class="goal-title">${goal.title}</h3>
                        <div class="goal-actions">
                            <button class="btn btn-icon edit-goal-btn" data-goal-id="${goal.id}" aria-label="Edit goal">✏️</button>
                            <button class="btn btn-icon delete-goal-btn" data-goal-id="${goal.id}" aria-label="Delete goal">🗑️</button>
                        </div>
                    </div>
                    
                    ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                    
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${goal.progress}%"></div>
                        </div>
                        <span class="progress-text">${goal.progress}%</span>
                    </div>
                    
                    <div class="goal-meta">
                        ${goal.targetDate ? `
                            <span class="goal-deadline ${isExpired ? 'expired' : ''}">
                                ${isExpired ? '⚠ Overdue by ' + Math.abs(daysRemaining) + ' days' : 
                                  daysRemaining === 0 ? 'Due today!' : 
                                  daysRemaining + ' days remaining'}
                            </span>
                        ` : ''}
                        <span class="goal-created">Created ${formatDate(goal.createdAt)}</span>
                    </div>
                    
                    <div class="goal-actions-bottom">
                        <button class="btn btn-sm update-progress-btn" data-goal-id="${goal.id}">Update Progress</button>
                        <button class="btn btn-sm btn-success complete-goal-btn" data-goal-id="${goal.id}">Mark Complete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        attachGoalListeners(activeContainer);
    }
    
    // Render completed goals
    if (completedGoals.length === 0) {
        completedContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div class="empty-state-title">No completed goals yet</div>
                <div class="empty-state-text">Complete a goal to see it here!</div>
            </div>
        `;
    } else {
        completedContainer.innerHTML = completedGoals.map(goal => `
            <div class="goal-card card completed" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h3 class="goal-title">✅ ${goal.title}</h3>
                    <div class="goal-actions">
                        <button class="btn btn-icon delete-goal-btn" data-goal-id="${goal.id}" aria-label="Delete goal">🗑️</button>
                    </div>
                </div>
                ${goal.description ? `<p class="goal-description">${goal.description}</p>` : ''}
                <div class="goal-meta">
                    ${goal.completedAt ? `<span>Completed ${formatDate(goal.completedAt)}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        attachGoalListeners(completedContainer);
    }
}

function attachGoalListeners(container) {
    // Edit goal buttons
    container.querySelectorAll('.edit-goal-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const goalId = btn.dataset.goalId;
            const goal = (await getAllGoals()).find(g => g.id === goalId);
            if (goal) {
                showEditGoalModal(goal);
            }
        });
    });
    
    // Delete goal buttons
    container.querySelectorAll('.delete-goal-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const goalId = btn.dataset.goalId;
            const goal = (await getAllGoals()).find(g => g.id === goalId);
            if (goal) {
                showDeleteGoalConfirmation(goal);
            }
        });
    });
    
    // Update progress buttons
    container.querySelectorAll('.update-progress-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const goalId = btn.dataset.goalId;
            const goal = (await getAllGoals()).find(g => g.id === goalId);
            if (goal) {
                showUpdateProgressModal(goal);
            }
        });
    });
    
    // Complete goal buttons
    container.querySelectorAll('.complete-goal-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const goalId = btn.dataset.goalId;
            const goal = (await getAllGoals()).find(g => g.id === goalId);
            if (goal) {
                showCompleteGoalConfirmation(goal);
            }
        });
    });
}

function setupEventListeners() {
    const newGoalBtn = document.getElementById('new-goal-btn');
    if (newGoalBtn) {
        newGoalBtn.addEventListener('click', () => showNewGoalModal());
    }
    
    // Tab switching
    document.querySelectorAll('.goals-tabs .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.goals-tabs .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            document.getElementById('active-goals').style.display = tab === 'active' ? 'block' : 'none';
            document.getElementById('completed-goals').style.display = tab === 'completed' ? 'block' : 'none';
        });
    });
}

function showNewGoalModal() {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="goal-title">Goal Title</label>
            <input class="form-input" type="text" id="goal-title" required placeholder="e.g., Learn React">
        </div>
        <div class="form-group">
            <label class="form-label" for="goal-description">Description</label>
            <textarea class="form-textarea" id="goal-description" placeholder="What do you want to achieve?"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="goal-target-date">Target Date</label>
            <input class="form-input" type="date" id="goal-target-date">
        </div>
        <div class="form-group">
            <label class="form-label" for="goal-progress">Initial Progress (%)</label>
            <input class="form-input" type="number" id="goal-progress" value="0" min="0" max="100">
        </div>
    `;
    
    modal.open({
        title: 'Create New Goal',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Create Goal',
                type: 'btn-primary',
                onClick: async () => {
                    const title = form.querySelector('#goal-title').value;
                    const description = form.querySelector('#goal-description').value;
                    const targetDate = form.querySelector('#goal-target-date').value;
                    const progress = parseInt(form.querySelector('#goal-progress').value) || 0;
                    
                    if (!title) {
                        toast.error('Please enter a goal title');
                        return;
                    }
                    
                    await createGoal({
                        title,
                        description,
                        targetDate: targetDate || null,
                        progress
                    });
                    
                    toast.success('Goal created!');
                    sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
                    await loadGoals();
                }
            }
        ]
    });
}

function showEditGoalModal(goal) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-goal-title">Goal Title</label>
            <input class="form-input" type="text" id="edit-goal-title" value="${goal.title}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-goal-description">Description</label>
            <textarea class="form-textarea" id="edit-goal-description">${goal.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-goal-target-date">Target Date</label>
            <input class="form-input" type="date" id="edit-goal-target-date" value="${goal.targetDate || ''}">
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-goal-progress">Progress (%)</label>
            <input class="form-input" type="number" id="edit-goal-progress" value="${goal.progress}" min="0" max="100">
        </div>
    `;
    
    modal.open({
        title: 'Edit Goal',
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
                    const title = form.querySelector('#edit-goal-title').value;
                    const description = form.querySelector('#edit-goal-description').value;
                    const targetDate = form.querySelector('#edit-goal-target-date').value;
                    const progress = parseInt(form.querySelector('#edit-goal-progress').value) || 0;
                    
                    if (!title) {
                        toast.error('Please enter a goal title');
                        return;
                    }
                    
                    await updateGoal(goal.id, {
                        title,
                        description,
                        targetDate: targetDate || null,
                        progress
                    });
                    
                    toast.success('Goal updated!');
                    await loadGoals();
                }
            }
        ]
    });
}

function showUpdateProgressModal(goal) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="update-progress">Current Progress (%)</label>
            <input class="form-input" type="number" id="update-progress" value="${goal.progress}" min="0" max="100">
        </div>
        <p>Current progress: ${goal.progress}%</p>
    `;
    
    modal.open({
        title: 'Update Progress',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Update',
                type: 'btn-primary',
                onClick: async () => {
                    const progress = parseInt(form.querySelector('#update-progress').value) || 0;
                    
                    await updateGoal(goal.id, { progress });
                    
                    if (progress === 100) {
                        toast.success('Goal completed! 🎉');
                        sparks.celebrate();
                    } else {
                        toast.success('Progress updated!');
                    }
                    
                    await loadGoals();
                }
            }
        ]
    });
}

function showCompleteGoalConfirmation(goal) {
    modal.open({
        title: 'Complete Goal',
        content: `<p>Are you sure you want to mark "<strong>${goal.title}</strong>" as complete?</p>`,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Complete Goal',
                type: 'btn-primary',
                onClick: async () => {
                    await updateGoal(goal.id, { 
                        completed: true,
                        progress: 100
                    });
                    
                    toast.success('Goal completed! 🎉');
                    sparks.celebrate();
                    await loadGoals();
                }
            }
        ]
    });
}

function showDeleteGoalConfirmation(goal) {
    modal.open({
        title: 'Delete Goal',
        content: `<p>Are you sure you want to delete "<strong>${goal.title}</strong>"?</p>`,
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
                    await deleteGoal(goal.id);
                    toast.success('Goal deleted');
                    await loadGoals();
                }
            }
        ]
    });
}