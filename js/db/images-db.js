import { createRecord, readRecord, readAllRecords, updateRecord, deleteRecord, generateId } from './database.js';

export async function createImageMetadata(imageData) {
    const image = {
        id: await generateId(),
        fileName: imageData.fileName,
        originalSize: imageData.originalSize,
        resultSize: imageData.resultSize || null,
        operation: imageData.operation || null,
        mimeType: imageData.mimeType,
        width: imageData.width || null,
        height: imageData.height || null,
        createdAt: new Date().toISOString()
    };
    
    await createRecord('images', image);
    return image;
}

export async function getImageMetadata(id) {
    return await readRecord('images', id);
}

export async function getAllImageMetadata() {
    return await readAllRecords('images');
}

export async function deleteImageMetadata(id) {
    await deleteRecord('images', id);
}

export async function createImageJob(jobData) {
    const job = {
        id: await generateId(),
        fileName: jobData.fileName,
        operation: jobData.operation,
        status: 'pending',
        progress: 0,
        originalSize: jobData.originalSize,
        resultSize: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    await createRecord('imageJobs', job);
    return job;
}

export async function updateImageJob(id, updates) {
    const job = await readRecord('imageJobs', id);
    if (!job) {
        throw new Error('Image job not found');
    }
    
    const updatedJob = {
        ...job,
        ...updates,
        id: job.id
    };
    
    if (updates.status === 'completed' || updates.status === 'failed') {
        updatedJob.completedAt = new Date().toISOString();
    }
    
    await updateRecord('imageJobs', updatedJob);
    return updatedJob;
}

export async function getImageJob(id) {
    return await readRecord('imageJobs', id);
}

export async function getAllImageJobs() {
    return await readAllRecords('imageJobs');
}