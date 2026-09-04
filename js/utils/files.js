// File handling utilities
export function validateFileType(file, allowedTypes) {
    if (!allowedTypes || allowedTypes.length === 0) return true;
    return allowedTypes.includes(file.type);
}

export function validateFileSize(file, maxSizeBytes) {
    return file.size <= maxSizeBytes;
}

export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function createObjectURL(blob) {
    return URL.createObjectURL(blob);
}

export function revokeObjectURL(url) {
    URL.revokeObjectURL(url);
}

export async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

export function blobToFile(blob, fileName, type) {
    return new File([blob], fileName, { type });
}