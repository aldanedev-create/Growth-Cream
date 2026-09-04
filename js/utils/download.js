// Download utility functions
export function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadText(text, fileName, contentType = 'application/json') {
    const blob = new Blob([text], { type: contentType });
    downloadBlob(blob, fileName);
}

export function downloadImage(canvas, fileName, mimeType = 'image/png', quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                downloadBlob(blob, fileName);
                resolve(blob);
            } else {
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, mimeType, quality);
    });
}