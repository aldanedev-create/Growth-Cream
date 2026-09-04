import { loadImage } from '../utils/files.js';
import { blobToFile } from '../utils/files.js';

export const SUPPORTED_FORMATS = {
    'image/jpeg': {
        extension: 'jpg',
        label: 'JPEG',
        supported: true
    },
    'image/png': {
        extension: 'png',
        label: 'PNG',
        supported: true
    },
    'image/webp': {
        extension: 'webp',
        label: 'WebP',
        supported: true
    }
};

export function checkFormatSupport(mimeType) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
        const dataUrl = canvas.toDataURL(mimeType);
        return dataUrl.startsWith(`data:${mimeType}`);
    } catch (e) {
        return false;
    }
}

export function detectAvifSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
        const dataUrl = canvas.toDataURL('image/avif');
        return dataUrl.startsWith('data:image/avif');
    } catch (e) {
        return false;
    }
}

export async function convertImage(imageSource, targetFormat) {
    const img = await loadImage(imageSource);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error(`Failed to convert image to ${targetFormat}`));
                }
            },
            targetFormat,
            0.9
        );
    });
    
    return blob;
}

export function getAvailableFormats() {
    const formats = [];
    
    for (const [mimeType, format] of Object.entries(SUPPORTED_FORMATS)) {
        if (checkFormatSupport(mimeType)) {
            formats.push({
                mimeType,
                ...format
            });
        }
    }
    
    // Check AVIF support
    if (detectAvifSupport()) {
        formats.push({
            mimeType: 'image/avif',
            extension: 'avif',
            label: 'AVIF',
            supported: true
        });
    }
    
    return formats;
}

export function getFileExtension(mimeType) {
    const formatMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/avif': 'avif',
        'image/gif': 'gif',
        'image/bmp': 'bmp'
    };
    
    return formatMap[mimeType] || 'png';
}