import { 
    createProject, 
    getAllProjects, 
    updateProject, 
    deleteProject,
    createTask,
    getTasksForProject,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    createNote,
    getNotesForProject,
    updateNote,
    deleteNote,
    calculateProjectProgress
} from '../db/projects-db.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { sparks } from '../components/sparks.js';
import { formatDate, getRelativeTime } from '../utils/dates.js';
import { truncateText } from '../utils/format.js';

let selectedProjectId = null;

export async function renderProjects(container) {
    container.innerHTML = `
        <div class="projects-container">
            <div class="section-header">
                <h2 class="section-title">💻 DevLog / Projects</h2>
                <button class="btn btn-primary" id="new-project-btn">
                    <span>+</span> New Project
                </button>
            </div>
            
            <div class="projects-layout">
                <div class="projects-list" id="projects-list">
                    <!-- Project cards will be rendered here -->
                </div>
                
                <div class="project-details" id="project-details">
                    <!-- Project details will be shown here -->
                </div>
            </div>
        </div>
    `;
    
    await loadProjects();
    setupEventListeners();
}

async function loadProjects() {
    const projects = await getAllProjects();
    const projectsList = document.getElementById('projects-list');
    
    if (!projectsList) return;
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💻</div>
                <div class="empty-state-title">No projects yet</div>
                <div class="empty-state-text">Start tracking your development projects!</div>
                <button class="btn btn-primary" onclick="document.getElementById('new-project-btn').click()">
                    Create your first project →
                </button>
            </div>
        `;
    } else {
        projectsList.innerHTML = projects.map(project => {
            const statusBadge = getStatusBadge(project.status);
            const isSelected = project.id === selectedProjectId;
            
            return `
                <div class="project-card card ${isSelected ? 'selected' : ''}" data-project-id="${project.id}">
                    <div class="project-header">
                        <h3 class="project-name">${project.name}</h3>
                        ${statusBadge}
                    </div>
                    <p class="project-description">${truncateText(project.description || 'No description', 80)}</p>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                        </div>
                        <span class="progress-text">${project.progress.toFixed(0)}%</span>
                    </div>
                    <div class="project-tech">
                        ${(project.technologies || []).slice(0, 3).map(tech => 
                            `<span class="badge">${tech}</span>`
                        ).join('')}
                    </div>
                    <div class="project-meta">
                        <span>Created ${getRelativeTime(project.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach click listeners
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.project-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedProjectId = card.dataset.projectId;
                showProjectDetails(selectedProjectId);
            });
        });
    }
}

function getStatusBadge(status) {
    const badges = {
        'planning': '<span class="badge">📋 Planning</span>',
        'active': '<span class="badge badge-success">🚀 Active</span>',
        'paused': '<span class="badge badge-warning">⏸ Paused</span>',
        'completed': '<span class="badge badge-success">✅ Completed</span>',
        'archived': '<span class="badge">📦 Archived</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

async function showProjectDetails(projectId) {
    const detailsContainer = document.getElementById('project-details');
    if (!detailsContainer) return;
    
    const project = (await getAllProjects()).find(p => p.id === projectId);
    if (!project) return;
    
    const tasks = await getTasksForProject(projectId);
    const notes = await getNotesForProject(projectId);
    const completedTasks = tasks.filter(t => t.completed).length;
    
    detailsContainer.innerHTML = `
        <div class="project-detail-card card">
            <div class="project-detail-header">
                <h2>${project.name}</h2>
                <div class="project-detail-actions">
                    <button class="btn btn-icon edit-project-btn" aria-label="Edit project">✏️</button>
                    <button class="btn btn-icon delete-project-btn" aria-label="Delete project">🗑️</button>
                </div>
            </div>
            
            <p class="project-detail-description">${project.description || 'No description'}</p>
            
            <div class="project-detail-progress">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                </div>
                <span>${project.progress.toFixed(0)}% Complete</span>
            </div>
            
            <div class="project-detail-section">
                <h3>Tasks (${completedTasks}/${tasks.length})</h3>
                <div class="tasks-list">
                    ${tasks.length === 0 ? 
                        '<p class="text-muted">No tasks yet</p>' : 
                        tasks.map(task => `
                            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                                <input type="checkbox" 
                                       class="task-checkbox" 
                                       data-task-id="${task.id}"
                                       ${task.completed ? 'checked' : ''}>
                                <span class="task-title">${task.title}</span>
                                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                <button class="btn btn-icon delete-task-btn" data-task-id="${task.id}" aria-label="Delete task">🗑️</button>
                            </div>
                        `).join('')
                    }
                </div>
                <button class="btn btn-sm" id="add-task-btn">+ Add Task</button>
            </div>
            
            <div class="project-detail-section">
                <h3>Notes (${notes.length})</h3>
                <div class="notes-list">
                    ${notes.length === 0 ? 
                        '<p class="text-muted">No notes yet</p>' : 
                        notes.map(note => `
                            <div class="note-item" data-note-id="${note.id}">
                                <h4>${note.title}</h4>
                                <p>${truncateText(note.content, 100)}</p>
                                <div class="note-actions">
                                    <button class="btn btn-sm edit-note-btn" data-note-id="${note.id}">Edit</button>
                                    <button class="btn btn-sm delete-note-btn" data-note-id="${note.id}">Delete</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <button class="btn btn-sm" id="add-note-btn">+ Add Note</button>
            </div>
            
            <div class="project-detail-section">
                <h3>Details</h3>
                <div class="project-details-grid">
                    <div>
                        <strong>Status:</strong> ${project.status}
                    </div>
                    <div>
                        <strong>Created:</strong> ${formatDate(project.createdAt)}
                    </div>
                    <div>
                        <strong>Updated:</strong> ${formatDate(project.updatedAt)}
                    </div>
                    ${project.githubUrl ? `
                        <div>
                            <strong>GitHub:</strong> 
                            <a href="${project.githubUrl}" target="_blank" rel="noopener">${project.githubUrl}</a>
                        </div>
                    ` : ''}
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div>
                            <strong>Technologies:</strong> ${project.technologies.join(', ')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    attachProjectDetailListeners(detailsContainer, project);
}

function attachProjectDetailListeners(detailsContainer, project) {
    // Edit project
    const editBtn = detailsContainer.querySelector('.edit-project-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => showEditProjectModal(project));
    }
    
    // Delete project
    const deleteBtn = detailsContainer.querySelector('.delete-project-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => showDeleteProjectConfirmation(project));
    }
    
    // Task checkboxes
    detailsContainer.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            const taskId = checkbox.dataset.taskId;
            await toggleTaskCompletion(taskId);
            
            if (checkbox.checked) {
                toast.success('Task completed!');
                sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 3);
            }
            
            // Update project progress
            const newProgress = await calculateProjectProgress(project.id);
            await updateProject(project.id, { progress: newProgress });
            
            await showProjectDetails(project.id);
            await loadProjects();
        });
    });
    
    // Delete task buttons
    detailsContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const taskId = btn.dataset.taskId;
            await deleteTask(taskId);
            toast.success('Task deleted');
            
            // Update project progress
            const newProgress = await calculateProjectProgress(project.id);
            await updateProject(project.id, { progress: newProgress });
            
            await showProjectDetails(project.id);
            await loadProjects();
        });
    });
    
    // Add task button
    const addTaskBtn = detailsContainer.querySelector('#add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => showAddTaskModal(project.id));
    }
    
    // Add note button
    const addNoteBtn = detailsContainer.querySelector('#add-note-btn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => showAddNoteModal(project.id));
    }
    
    // Edit note buttons
    detailsContainer.querySelectorAll('.edit-note-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const noteId = btn.dataset.noteId;
            const notes = await getNotesForProject(project.id);
            const note = notes.find(n => n.id === noteId);
            if (note) {
                showEditNoteModal(note);
            }
        });
    });
    
    // Delete note buttons
    detailsContainer.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const noteId = btn.dataset.noteId;
            await deleteNote(noteId);
            toast.success('Note deleted');
            await showProjectDetails(project.id);
        });
    });
}

function setupEventListeners() {
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => showNewProjectModal());
    }
}

function showNewProjectModal() {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="project-name">Project Name</label>
            <input class="form-input" type="text" id="project-name" required placeholder="e.g., My Awesome App">
        </div>
        <div class="form-group">
            <label class="form-label" for="project-description">Description</label>
            <textarea class="form-textarea" id="project-description" placeholder="What is this project about?"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="project-status">Status</label>
            <select class="form-select" id="project-status">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="project-github">GitHub URL</label>
            <input class="form-input" type="url" id="project-github" placeholder="https://github.com/username/repo">
        </div>
        <div class="form-group">
            <label class="form-label" for="project-tech">Technologies (comma-separated)</label>
            <input class="form-input" type="text" id="project-tech" placeholder="JavaScript, HTML, CSS">
        </div>
    `;
    
    modal.open({
        title: 'Create New Project',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Create Project',
                type: 'btn-primary',
                onClick: async () => {
                    const name = form.querySelector('#project-name').value;
                    const description = form.querySelector('#project-description').value;
                    const status = form.querySelector('#project-status').value;
                    const githubUrl = form.querySelector('#project-github').value;
                    const techString = form.querySelector('#project-tech').value;
                    const technologies = techString ? techString.split(',').map(t => t.trim()) : [];
                    
                    if (!name) {
                        toast.error('Please enter a project name');
                        return;
                    }
                    
                    const project = await createProject({
                        name,
                        description,
                        status,
                        githubUrl,
                        technologies
                    });
                    
                    toast.success('Project created!');
                    sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
                    
                    selectedProjectId = project.id;
                    await loadProjects();
                    await showProjectDetails(project.id);
                }
            }
        ]
    });
}

function showEditProjectModal(project) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-project-name">Project Name</label>
            <input class="form-input" type="text" id="edit-project-name" value="${project.name}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-project-description">Description</label>
            <textarea class="form-textarea" id="edit-project-description">${project.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-project-status">Status</label>
            <select class="form-select" id="edit-project-status">
                <option value="planning" ${project.status === 'planning' ? 'selected' : ''}>Planning</option>
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>Paused</option>
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-project-github">GitHub URL</label>
            <input class="form-input" type="url" id="edit-project-github" value="${project.githubUrl || ''}">
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-project-tech">Technologies (comma-separated)</label>
            <input class="form-input" type="text" id="edit-project-tech" value="${(project.technologies || []).join(', ')}">
        </div>
    `;
    
    modal.open({
        title: 'Edit Project',
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
                    const name = form.querySelector('#edit-project-name').value;
                    const description = form.querySelector('#edit-project-description').value;
                    const status = form.querySelector('#edit-project-status').value;
                    const githubUrl = form.querySelector('#edit-project-github').value;
                    const techString = form.querySelector('#edit-project-tech').value;
                    const technologies = techString ? techString.split(',').map(t => t.trim()) : [];
                    
                    if (!name) {
                        toast.error('Please enter a project name');
                        return;
                    }
                    
                    await updateProject(project.id, {
                        name,
                        description,
                        status,
                        githubUrl,
                        technologies
                    });
                    
                    toast.success('Project updated!');
                    await loadProjects();
                    await showProjectDetails(project.id);
                }
            }
        ]
    });
}

function showDeleteProjectConfirmation(project) {
    modal.open({
        title: 'Delete Project',
        content: `<p>Are you sure you want to delete "<strong>${project.name}</strong>"? This will also delete all tasks and notes.</p>`,
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
                    await deleteProject(project.id);
                    toast.success('Project deleted');
                    selectedProjectId = null;
                    await loadProjects();
                    document.getElementById('project-details').innerHTML = '';
                }
            }
        ]
    });
}

function showAddTaskModal(projectId) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="task-title">Task Title</label>
            <input class="form-input" type="text" id="task-title" required placeholder="e.g., Implement login">
        </div>
        <div class="form-group">
            <label class="form-label" for="task-description">Description</label>
            <textarea class="form-textarea" id="task-description" placeholder="Task details"></textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="task-priority">Priority</label>
            <select class="form-select" id="task-priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
            </select>
        </div>
    `;
    
    modal.open({
        title: 'Add Task',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Add Task',
                type: 'btn-primary',
                onClick: async () => {
                    const title = form.querySelector('#task-title').value;
                    const description = form.querySelector('#task-description').value;
                    const priority = form.querySelector('#task-priority').value;
                    
                    if (!title) {
                        toast.error('Please enter a task title');
                        return;
                    }
                    
                    await createTask({
                        projectId,
                        title,
                        description,
                        priority
                    });
                    
                    toast.success('Task added!');
                    await showProjectDetails(projectId);
                }
            }
        ]
    });
}

function showAddNoteModal(projectId) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="note-title">Note Title</label>
            <input class="form-input" type="text" id="note-title" required placeholder="e.g., Meeting notes">
        </div>
        <div class="form-group">
            <label class="form-label" for="note-content">Content</label>
            <textarea class="form-textarea" id="note-content" placeholder="Note content"></textarea>
        </div>
    `;
    
    modal.open({
        title: 'Add Note',
        content: form,
        actions: [
            {
                label: 'Cancel',
                type: 'btn',
                onClick: () => {}
            },
            {
                label: 'Add Note',
                type: 'btn-primary',
                onClick: async () => {
                    const title = form.querySelector('#note-title').value;
                    const content = form.querySelector('#note-content').value;
                    
                    if (!title) {
                        toast.error('Please enter a note title');
                        return;
                    }
                    
                    await createNote({
                        projectId,
                        title,
                        content
                    });
                    
                    toast.success('Note added!');
                    await showProjectDetails(projectId);
                }
            }
        ]
    });
}

function showEditNoteModal(note) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-note-title">Note Title</label>
            <input class="form-input" type="text" id="edit-note-title" value="${note.title}" required>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-note-content">Content</label>
            <textarea class="form-textarea" id="edit-note-content">${note.content || ''}</textarea>
        </div>
    `;
    
    modal.open({
        title: 'Edit Note',
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
                    const title = form.querySelector('#edit-note-title').value;
                    const content = form.querySelector('#edit-note-content').value;
                    
                    if (!title) {
                        toast.error('Please enter a note title');
                        return;
                    }
                    
                    await updateNote(note.id, {
                        title,
                        content
                    });
                    
                    toast.success('Note updated!');
                    await showProjectDetails(note.projectId);
                }
            }
        ]
    });
}