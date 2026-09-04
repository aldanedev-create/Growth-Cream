import { loadImage } from '../utils/files.js';

export async function stripMetadata(imageSource) {
    const img = await loadImage(imageSource);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return canvas;
}

export async function getImageMetadata(imageSource) {
    const img = await loadImage(imageSource);
    
    const metadata = {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
    };
    
    // Try to get EXIF data if available
    if (typeof EXIF !== 'undefined' && imageSource instanceof File) {
        try {
            const exifData = await new Promise((resolve, reject) => {
                EXIF.getData(imageSource, function() {
                    resolve(this.exifdata);
                });
            });
            metadata.exif = exifData;
        } catch (e) {
            // EXIF reading not supported
        }
    }
    
    return metadata;
}

export function getImageType(file) {
    if (file.type) return file.type;
    
    const extension = file.name.split('.').pop().toLowerCase();
    const typeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'avif': 'image/avif'
    };
    
    return typeMap[extension] || 'application/octet-stream';
}