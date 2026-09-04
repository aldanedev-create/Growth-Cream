import { loadImage } from '../utils/files.js';
import { formatBytes } from '../utils/format.js';

export async function compressImage(imageSource, quality = 0.8, mimeType = 'image/jpeg') {
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
                    reject(new Error('Failed to compress image'));
                }
            },
            mimeType,
            quality
        );
    });
    
    return blob;
}

export function calculateCompressionStats(originalSize, compressedSize) {
    const savings = originalSize - compressedSize;
    const savingsPercentage = originalSize > 0 ? (savings / originalSize) * 100 : 0;
    
    return {
        originalSize,
        compressedSize,
        savings,
        savingsPercentage,
        originalSizeFormatted: formatBytes(originalSize),
        compressedSizeFormatted: formatBytes(compressedSize),
        savingsFormatted: formatBytes(savings)
    };
}

export async function compressImageWithTargetSize(imageSource, targetSizeBytes, mimeType = 'image/jpeg') {
    let quality = 0.9;
    let compressedBlob = await compressImage(imageSource, quality, mimeType);
    
    // Binary search for optimal quality
    let minQuality = 0.1;
    let maxQuality = 1.0;
    
    for (let i = 0; i < 10; i++) {
        if (compressedBlob.size <= targetSizeBytes) {
            minQuality = quality;
            quality = (quality + maxQuality) / 2;
        } else {
            maxQuality = quality;
            quality = (quality + minQuality) / 2;
        }
        
        compressedBlob = await compressImage(imageSource, quality, mimeType);
        
        if (Math.abs(compressedBlob.size - targetSizeBytes) < targetSizeBytes * 0.05) {
            break;
        }
    }
    
    return compressedBlob;
}