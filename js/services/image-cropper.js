import { loadImage } from '../utils/files.js';

export const CROP_PRESETS = {
    'free': { label: 'Free', ratio: null },
    '1:1': { label: '1:1', ratio: 1 },
    '4:3': { label: '4:3', ratio: 4/3 },
    '16:9': { label: '16:9', ratio: 16/9 },
    '3:2': { label: '3:2', ratio: 3/2 },
    '9:16': { label: '9:16', ratio: 9/16 }
};

export async function cropImage(imageSource, cropArea) {
    const img = await loadImage(imageSource);
    
    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    );
    
    return canvas;
}

export function calculateCropArea(imageWidth, imageHeight, preset = 'free', customArea = null) {
    if (customArea) {
        return customArea;
    }
    
    const cropPreset = CROP_PRESETS[preset];
    
    if (!cropPreset || !cropPreset.ratio) {
        // Free crop - default to full image
        return {
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight
        };
    }
    
    const ratio = cropPreset.ratio;
    let width = imageWidth;
    let height = Math.round(width / ratio);
    
    if (height > imageHeight) {
        height = imageHeight;
        width = Math.round(height * ratio);
    }
    
    const x = Math.round((imageWidth - width) / 2);
    const y = Math.round((imageHeight - height) / 2);
    
    return {
        x,
        y,
        width,
        height
    };
}

export async function rotateImage(imageSource, degrees) {
    const img = await loadImage(imageSource);
    
    const rad = (degrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * cos + img.height * sin);
    canvas.height = Math.round(img.width * sin + img.height * cos);
    
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    return canvas;
}

export async function flipImage(imageSource, direction) {
    const img = await loadImage(imageSource);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    if (direction === 'horizontal') {
        ctx.scale(-1, 1);
    } else if (direction === 'vertical') {
        ctx.scale(1, -1);
    }
    
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    
    return canvas;
}