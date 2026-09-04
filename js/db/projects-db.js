import { createRecord, readRecord, readAllRecords, updateRecord, deleteRecord, getByIndex, generateId } from './database.js';

export async function createProject(projectData) {
    const project = {
        id: await generateId(),
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'planning',
        progress: projectData.progress || 0,
        githubUrl: projectData.githubUrl || '',
        technologies: projectData.technologies || [],
        milestones: projectData.milestones || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await createRecord('projects', project);
    return project;
}

export async function getProject(id) {
    return await readRecord('projects', id);
}

export async function getAllProjects() {
    return await readAllRecords('projects');
}

export async function updateProject(id, updates) {
    const project = await getProject(id);
    if (!project) {
        throw new Error('Project not found');
    }
    
    const updatedProject = {
        ...project,
        ...updates,
        id: project.id,
        updatedAt: new Date().toISOString()
    };
    
    await updateRecord('projects', updatedProject);
    return updatedProject;
}

export async function deleteProject(id) {
    await deleteRecord('projects', id);
    
    // Delete associated tasks and notes
    const tasks = await getTasksForProject(id);
    for (const task of tasks) {
        await deleteRecord('tasks', task.id);
    }
    
    const notes = await getNotesForProject(id);
    for (const note of notes) {
        await deleteRecord('notes', note.id);
    }
}

// Tasks
export async function createTask(taskData) {
    const task = {
        id: await generateId(),
        projectId: taskData.projectId,
        title: taskData.title,
        description: taskData.description || '',
        completed: taskData.completed || false,
        priority: taskData.priority || 'medium',
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    await createRecord('tasks', task);
    return task;
}

export async function getTask(id) {
    return await readRecord('tasks', id);
}

export async function getTasksForProject(projectId) {
    return await getByIndex('tasks', 'projectId', projectId);
}

export async function getAllTasks() {
    return await readAllRecords('tasks');
}

export async function updateTask(id, updates) {
    const task = await getTask(id);
    if (!task) {
        throw new Error('Task not found');
    }
    
    const updatedTask = {
        ...task,
        ...updates,
        id: task.id
    };
    
    if (updates.completed && !task.completed) {
        updatedTask.completedAt = new Date().toISOString();
    } else if (updates.completed === false) {
        updatedTask.completedAt = null;
    }
    
    await updateRecord('tasks', updatedTask);
    return updatedTask;
}

export async function deleteTask(id) {
    await deleteRecord('tasks', id);
}

export async function toggleTaskCompletion(id) {
    const task = await getTask(id);
    if (!task) {
        throw new Error('Task not found');
    }
    
    return await updateTask(id, { completed: !task.completed });
}

// Notes
export async function createNote(noteData) {
    const note = {
        id: await generateId(),
        projectId: noteData.projectId,
        title: noteData.title,
        content: noteData.content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await createRecord('notes', note);
    return note;
}

export async function getNote(id) {
    return await readRecord('notes', id);
}

export async function getNotesForProject(projectId) {
    return await getByIndex('notes', 'projectId', projectId);
}

export async function updateNote(id, updates) {
    const note = await getNote(id);
    if (!note) {
        throw new Error('Note not found');
    }
    
    const updatedNote = {
        ...note,
        ...updates,
        id: note.id,
        updatedAt: new Date().toISOString()
    };
    
    await updateRecord('notes', updatedNote);
    return updatedNote;
}

export async function deleteNote(id) {
    await deleteRecord('notes', id);
}

// Project progress calculation
export async function calculateProjectProgress(projectId) {
    const tasks = await getTasksForProject(projectId);
    
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.completed);
    return (completedTasks.length / tasks.length) * 100;
}