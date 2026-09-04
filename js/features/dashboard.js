import { getAllHabits, getAllCompletions } from '../db/habits-db.js';
import { getAllProjects, getAllTasks } from '../db/projects-db.js';
import { getAllGoals } from '../db/goals-db.js';
import { getAllStorageDevices } from '../db/storage-db.js';
import { 
    calculatePersonalGrowthScore, 
    calculateProjectGrowthScore, 
    calculateGoalsGrowthScore,
    calculateOverallGrowthScore,
    calculateHabitCompletionTrend
} from '../services/growth-calculator.js';
import { calculateCurrentStreak } from '../services/streak-calculator.js';
import { formatBytes } from '../utils/format.js';
import { getRelativeTime } from '../utils/dates.js';
import { router } from '../router.js';
import { sparks } from '../components/sparks.js';

export async function renderDashboard(container) {
    const [habits, completions, projects, tasks, goals, devices] = await Promise.all([
        getAllHabits(),
        getAllCompletions(),
        getAllProjects(),
        getAllTasks(),
        getAllGoals(),
        getAllStorageDevices()
    ]);
    
    const personalScore = calculatePersonalGrowthScore(habits, completions);
    const projectScore = calculateProjectGrowthScore(projects, tasks);
    const goalsScore = calculateGoalsGrowthScore(goals);
    const overallScore = calculateOverallGrowthScore(habits, completions, projects, tasks, goals);
    
    const bestStreak = habits.reduce((max, habit) => {
        const habitCompletions = completions.filter(c => c.habitId === habit.id);
        const streak = calculateCurrentStreak(habitCompletions);
        return Math.max(max, streak);
    }, 0);
    
    const activeProjects = projects.filter(p => p.status === 'active');
    const activeGoals = goals.filter(g => !g.completed);
    const todayCompletions = completions.filter(c => {
        const today = new Date().toISOString().split('T')[0];
        return c.date === today;
    });
    
    container.innerHTML = `
        <div class="dashboard-container">
            <div class="section-header dashboard-header">
                <div>
                    <h2 class="section-title">⌂ Dashboard</h2>
                    <p class="dashboard-greeting">Good ${getGreeting()}, here's where things stand 👋</p>
                </div>
            </div>
            
            <div class="growth-hero">
                <div class="growth-hero-top">
                    <div class="growth-ring" style="--score: ${overallScore}">
                        <div class="growth-ring-value">
                            <span class="score-number">${overallScore.toFixed(0)}</span>
                            <span class="score-total">/ 100</span>
                        </div>
                    </div>
                    <div class="growth-hero-copy">
                        <h3>Your growth</h3>
                        <p class="growth-hero-sub">${getGrowthMessage(overallScore)}</p>
                    </div>
                </div>
                
                <div class="growth-breakdown">
                    <div class="growth-item" data-category="personal">
                        <span class="growth-icon">🌱</span>
                        <span class="growth-label">Personal</span>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${personalScore}%"></div>
                        </div>
                        <span class="growth-value">${personalScore.toFixed(0)}%</span>
                    </div>
                    
                    <div class="growth-item" data-category="projects">
                        <span class="growth-icon">💻</span>
                        <span class="growth-label">Projects</span>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${projectScore}%"></div>
                        </div>
                        <span class="growth-value">${projectScore.toFixed(0)}%</span>
                    </div>
                    
                    <div class="growth-item" data-category="goals">
                        <span class="growth-icon">🎯</span>
                        <span class="growth-label">Goals</span>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${goalsScore}%"></div>
                        </div>
                        <span class="growth-value">${goalsScore.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-grid grid-3">
                <div class="stat-tile" onclick="window.location.hash='#habits'">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-content">
                        <div class="stat-value">${bestStreak} days</div>
                        <div class="stat-label">Best streak</div>
                    </div>
                </div>
                
                <div class="stat-tile" onclick="window.location.hash='#habits'">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">${todayCompletions.length}</div>
                        <div class="stat-label">Today's habits</div>
                    </div>
                </div>
                
                <div class="stat-tile" onclick="window.location.hash='#projects'">
                    <div class="stat-icon">🚀</div>
                    <div class="stat-content">
                        <div class="stat-value">${activeProjects.length}</div>
                        <div class="stat-label">Active projects</div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-sections grid-2">
                <div class="recent-section">
                    <h3>Recent projects</h3>
                    ${projects.length === 0 ? 
                        createEmptyState('No projects yet', 'Create your first project →', '#projects') : 
                        projects.slice(0, 3).map(project => `
                            <div class="recent-item">
                                <span class="recent-icon">💻</span>
                                <div class="recent-content">
                                    <div class="recent-title">${project.name}</div>
                                    <div class="recent-meta">Updated ${getRelativeTime(project.updatedAt)}</div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                
                <div class="goals-section">
                    <h3>Active goals</h3>
                    ${activeGoals.length === 0 ? 
                        createEmptyState('No active goals', 'Set a goal →', '#goals') : 
                        activeGoals.slice(0, 3).map(goal => `
                            <div class="recent-item">
                                <span class="recent-icon">🎯</span>
                                <div class="recent-content">
                                    <div class="recent-title">${goal.title}</div>
                                    <div class="recent-meta">${goal.progress}% complete</div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${goal.progress}%"></div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <div class="quick-actions">
                <h3>Quick actions</h3>
                <div class="quick-actions-grid">
                    <button class="btn quick-action" onclick="window.location.hash='#image-studio'">
                        <span>🖼</span> Image Studio
                    </button>
                    <button class="btn quick-action" onclick="window.location.hash='#storage'">
                        <span>💾</span> Storage
                    </button>
                    <button class="btn quick-action" onclick="window.location.hash='#settings'">
                        <span>⚙</span> Settings
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Ambient sparks on dashboard
    setTimeout(() => {
        sparks.ambientSparks();
    }, 1000);
}

function getGrowthMessage(score) {
    if (score <= 0) return "Let's log your first win today.";
    if (score < 34) return "You're just getting started — small steps count.";
    if (score < 67) return "Solid momentum. Keep the streak going.";
    return "Excellent work — you're thriving across the board.";
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

function createEmptyState(title, actionText, hash) {
    return `
        <div class="empty-state">
            <p>${title}</p>
            <button class="btn btn-sm btn-primary" onclick="window.location.hash='${hash}'">${actionText}</button>
        </div>
    `;
}