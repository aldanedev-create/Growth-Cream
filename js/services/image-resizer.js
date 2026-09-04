import { loadImage } from '../utils/files.js';

export async function resizeImage(imageSource, width, height, maintainAspectRatio = true) {
    const img = await loadImage(imageSource);
    
    let targetWidth = width;
    let targetHeight = height;
    
    if (maintainAspectRatio) {
        if (width && height) {
            // Use both dimensions
            targetWidth = width;
            targetHeight = height;
        } else if (width) {
            // Only width specified
            targetWidth = width;
            targetHeight = Math.round((width / img.width) * img.height);
        } else if (height) {
            // Only height specified
            targetHeight = height;
            targetWidth = Math.round((height / img.height) * img.width);
        }
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    return canvas;
}

export function getImageDimensions(imageSource) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.width,
                height: img.height
            });
        };
        img.onerror = reject;
        img.src = imageSource;
    });
}

export function calculateResizedDimensions(originalWidth, originalHeight, targetWidth, targetHeight, maintainAspectRatio) {
    if (!maintainAspectRatio) {
        return {
            width: targetWidth || originalWidth,
            height: targetHeight || originalHeight
        };
    }
    
    if (targetWidth && targetHeight) {
        return {
            width: targetWidth,
            height: targetHeight
        };
    }
    
    if (targetWidth) {
        return {
            width: targetWidth,
            height: Math.round((targetWidth / originalWidth) * originalHeight)
        };
    }
    
    if (targetHeight) {
        return {
            width: Math.round((targetHeight / originalHeight) * originalWidth),
            height: targetHeight
        };
    }
    
    return {
        width: originalWidth,
        height: originalHeight
    };
}