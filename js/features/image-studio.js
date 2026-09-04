import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { sparks } from '../components/sparks.js';
import { resizeImage, getImageDimensions } from '../services/image-resizer.js';
import { compressImage, calculateCompressionStats } from '../services/image-compressor.js';
import { convertImage, getAvailableFormats } from '../services/image-converter.js';
import { cropImage, rotateImage, flipImage, CROP_PRESETS } from '../services/image-cropper.js';
import { stripMetadata } from '../services/image-metadata.js';
import { formatBytes } from '../utils/format.js';
import { downloadBlob, downloadImage } from '../utils/download.js';
import { loadImage, createObjectURL, revokeObjectURL } from '../utils/files.js';

let currentImage = null;
let currentOperation = 'resize';
let originalFile = null;
let previewUrl = null;
let batchImages = [];

export async function renderImageStudio(container) {
    container.innerHTML = `
        <div class="image-studio-container">
            <div class="section-header">
                <h2 class="section-title">🖼 Image Studio</h2>
            </div>
            
            <div class="image-tabs">
                <button class="btn ${currentOperation === 'resize' ? 'active' : ''}" data-op="resize">Resize</button>
                <button class="btn ${currentOperation === 'compress' ? 'active' : ''}" data-op="compress">Compress</button>
                <button class="btn ${currentOperation === 'crop' ? 'active' : ''}" data-op="crop">Crop</button>
                <button class="btn ${currentOperation === 'convert' ? 'active' : ''}" data-op="convert">Convert</button>
                <button class="btn ${currentOperation === 'rotate' ? 'active' : ''}" data-op="rotate">Rotate</button>
                <button class="btn ${currentOperation === 'flip' ? 'active' : ''}" data-op="flip">Flip</button>
                <button class="btn ${currentOperation === 'batch' ? 'active' : ''}" data-op="batch">Batch</button>
            </div>
            
            <div class="image-workspace">
                <div class="image-upload-area">
                    ${createDropzone()}
                </div>
                
                <div class="image-preview-area" id="image-preview-area" style="display: none;">
                    <div class="image-preview-header">
                        <h3 id="image-filename"></h3>
                        <span id="image-dimensions"></span>
                        <span id="image-size"></span>
                    </div>
                    <div class="image-preview" id="image-preview"></div>
                    <div class="image-actions" id="image-actions"></div>
                </div>
            </div>
            
            <div class="image-settings" id="image-settings" style="display: none;">
                <!-- Settings will be rendered based on operation -->
            </div>
        </div>
    `;
    
    setupEventListeners();
}

function createDropzone() {
    return `
        <div class="dropzone" id="image-dropzone">
            <div class="dropzone-content">
                <div class="dropzone-icon">🖼</div>
                <p>Drop image here</p>
                <p class="dropzone-spark">✦</p>
                <p>or</p>
                <button class="btn btn-primary" id="choose-image-btn">Choose Image</button>
                <input type="file" id="file-input" accept="image/*" style="display: none;">
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.image-tabs .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentOperation = btn.dataset.op;
            document.querySelectorAll('.image-tabs .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (currentImage || batchImages.length > 0) {
                showSettings();
            }
        });
    });
    
    // File input
    const chooseImageBtn = document.getElementById('choose-image-btn');
    const fileInput = document.getElementById('file-input');
    
    if (chooseImageBtn && fileInput) {
        chooseImageBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Dropzone
    const dropzone = document.getElementById('image-dropzone');
    if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                if (currentOperation === 'batch') {
                    handleBatchFiles(files);
                } else {
                    handleFile(files[0]);
                }
            }
        });
    }
}

async function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        if (currentOperation === 'batch') {
            await handleBatchFiles(files);
        } else {
            await handleFile(files[0]);
        }
    }
}

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
    }
    
    originalFile = file;
    currentImage = file;
    
    if (previewUrl) {
        revokeObjectURL(previewUrl);
    }
    previewUrl = createObjectURL(file);
    
    const dimensions = await getImageDimensions(previewUrl);
    
    // Update UI
    document.getElementById('image-preview-area').style.display = 'block';
    document.getElementById('image-settings').style.display = 'block';
    document.getElementById('image-filename').textContent = file.name;
    document.getElementById('image-dimensions').textContent = `${dimensions.width} × ${dimensions.height}`;
    document.getElementById('image-size').textContent = formatBytes(file.size);
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `<img src="${previewUrl}" alt="${file.name}" style="max-width: 100%; max-height: 400px;">`;
    
    showSettings();
    toast.success('Image loaded successfully');
}

async function handleBatchFiles(files) {
    batchImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (batchImages.length === 0) {
        toast.error('No valid image files selected');
        return;
    }
    
    // Show batch interface
    document.getElementById('image-preview-area').style.display = 'block';
    document.getElementById('image-settings').style.display = 'block';
    
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div class="batch-list">
            ${batchImages.map((file, index) => `
                <div class="batch-item" data-index="${index}">
                    <span class="batch-name">${file.name}</span>
                    <span class="batch-size">${formatBytes(file.size)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    showSettings();
    toast.success(`${batchImages.length} images loaded`);
}

function showSettings() {
    const settingsContainer = document.getElementById('image-settings');
    const actionsContainer = document.getElementById('image-actions');
    
    if (!settingsContainer || !actionsContainer) return;
    
    switch (currentOperation) {
        case 'resize':
            settingsContainer.innerHTML = createResizeSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-resize-btn">Apply Resize</button>';
            setupResizeListeners();
            break;
        case 'compress':
            settingsContainer.innerHTML = createCompressSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-compress-btn">Compress Image</button>';
            setupCompressListeners();
            break;
        case 'crop':
            settingsContainer.innerHTML = createCropSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-crop-btn">Apply Crop</button>';
            setupCropListeners();
            break;
        case 'convert':
            settingsContainer.innerHTML = createConvertSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-convert-btn">Convert Image</button>';
            setupConvertListeners();
            break;
        case 'rotate':
            settingsContainer.innerHTML = createRotateSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-rotate-btn">Apply Rotation</button>';
            setupRotateListeners();
            break;
        case 'flip':
            settingsContainer.innerHTML = createFlipSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-flip-btn">Apply Flip</button>';
            setupFlipListeners();
            break;
        case 'batch':
            settingsContainer.innerHTML = createBatchSettings();
            actionsContainer.innerHTML = '<button class="btn btn-primary" id="apply-batch-btn">Process Batch</button>';
            setupBatchListeners();
            break;
    }
}

function createResizeSettings() {
    return `
        <h3>Resize Image</h3>
        <div class="form-group">
            <label class="form-label">
                <input type="checkbox" id="maintain-aspect" checked>
                Maintain aspect ratio
            </label>
        </div>
        <div class="form-group">
            <label class="form-label" for="resize-width">Width (px)</label>
            <input class="form-input" type="number" id="resize-width" placeholder="Auto">
        </div>
        <div class="form-group">
            <label class="form-label" for="resize-height">Height (px)</label>
            <input class="form-input" type="number" id="resize-height" placeholder="Auto">
        </div>
    `;
}

function setupResizeListeners() {
    const applyBtn = document.getElementById('apply-resize-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const width = parseInt(document.getElementById('resize-width').value);
            const height = parseInt(document.getElementById('resize-height').value);
            const maintainAspect = document.getElementById('maintain-aspect').checked;
            
            if (!width && !height) {
                toast.error('Please enter width or height');
                return;
            }
            
            try {
                const canvas = await resizeImage(previewUrl, width || null, height || null, maintainAspect);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, originalFile.type));
                
                showResult(canvas, blob, 'resized');
            } catch (error) {
                toast.error('Failed to resize image: ' + error.message);
            }
        });
    }
}

function createCompressSettings() {
    return `
        <h3>Compress Image</h3>
        <div class="form-group">
            <label class="form-label" for="compress-quality">Quality: <span id="quality-value">80%</span></label>
            <input class="form-input" type="range" id="compress-quality" min="10" max="100" value="80">
        </div>
        <div class="form-group">
            <label class="form-label" for="compress-format">Output Format</label>
            <select class="form-select" id="compress-format">
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
            </select>
        </div>
    `;
}

function setupCompressListeners() {
    const qualitySlider = document.getElementById('compress-quality');
    const qualityValue = document.getElementById('quality-value');
    
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value + '%';
        });
    }
    
    const applyBtn = document.getElementById('apply-compress-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const quality = parseInt(document.getElementById('compress-quality').value) / 100;
            const format = document.getElementById('compress-format').value;
            
            try {
                const blob = await compressImage(previewUrl, quality, format);
                const img = await loadImage(URL.createObjectURL(blob));
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                
                showResult(canvas, blob, 'compressed');
            } catch (error) {
                toast.error('Failed to compress image: ' + error.message);
            }
        });
    }
}

function createCropSettings() {
    return `
        <h3>Crop Image</h3>
        <div class="form-group">
            <label class="form-label" for="crop-preset">Aspect Ratio</label>
            <select class="form-select" id="crop-preset">
                ${Object.entries(CROP_PRESETS).map(([key, preset]) => 
                    `<option value="${key}">${preset.label}</option>`
                ).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" for="crop-x">X</label>
            <input class="form-input" type="number" id="crop-x" value="0">
        </div>
        <div class="form-group">
            <label class="form-label" for="crop-y">Y</label>
            <input class="form-input" type="number" id="crop-y" value="0">
        </div>
        <div class="form-group">
            <label class="form-label" for="crop-width">Width</label>
            <input class="form-input" type="number" id="crop-width">
        </div>
        <div class="form-group">
            <label class="form-label" for="crop-height">Height</label>
            <input class="form-input" type="number" id="crop-height">
        </div>
    `;
}

function setupCropListeners() {
    const applyBtn = document.getElementById('apply-crop-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const preset = document.getElementById('crop-preset').value;
            const x = parseInt(document.getElementById('crop-x').value) || 0;
            const y = parseInt(document.getElementById('crop-y').value) || 0;
            const width = parseInt(document.getElementById('crop-width').value);
            const height = parseInt(document.getElementById('crop-height').value);
            
            if (!width || !height) {
                toast.error('Please enter crop dimensions');
                return;
            }
            
            try {
                const canvas = await cropImage(previewUrl, { x, y, width, height });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, originalFile.type));
                
                showResult(canvas, blob, 'cropped');
            } catch (error) {
                toast.error('Failed to crop image: ' + error.message);
            }
        });
    }
}

function createConvertSettings() {
    const formats = getAvailableFormats();
    
    return `
        <h3>Convert Image</h3>
        <div class="form-group">
            <label class="form-label" for="convert-format">Target Format</label>
            <select class="form-select" id="convert-format">
                ${formats.map(format => 
                    `<option value="${format.mimeType}">${format.label}</option>`
                ).join('')}
            </select>
        </div>
    `;
}

function setupConvertListeners() {
    const applyBtn = document.getElementById('apply-convert-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const format = document.getElementById('convert-format').value;
            
            try {
                const blob = await convertImage(previewUrl, format);
                const img = await loadImage(URL.createObjectURL(blob));
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                
                showResult(canvas, blob, 'converted');
            } catch (error) {
                toast.error('Failed to convert image: ' + error.message);
            }
        });
    }
}

function createRotateSettings() {
    return `
        <h3>Rotate Image</h3>
        <div class="form-group">
            <label class="form-label">Rotation Angle</label>
            <div class="button-group">
                <button class="btn" data-angle="90">90°</button>
                <button class="btn" data-angle="180">180°</button>
                <button class="btn" data-angle="270">270°</button>
            </div>
        </div>
    `;
}

function setupRotateListeners() {
    let selectedAngle = 90;
    
    document.querySelectorAll('[data-angle]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAngle = parseInt(btn.dataset.angle);
            document.querySelectorAll('[data-angle]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    const applyBtn = document.getElementById('apply-rotate-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            try {
                const canvas = await rotateImage(previewUrl, selectedAngle);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, originalFile.type));
                
                showResult(canvas, blob, 'rotated');
            } catch (error) {
                toast.error('Failed to rotate image: ' + error.message);
            }
        });
    }
}

function createFlipSettings() {
    return `
        <h3>Flip Image</h3>
        <div class="form-group">
            <label class="form-label">Flip Direction</label>
            <div class="button-group">
                <button class="btn active" data-direction="horizontal">Horizontal</button>
                <button class="btn" data-direction="vertical">Vertical</button>
            </div>
        </div>
    `;
}

function setupFlipListeners() {
    let selectedDirection = 'horizontal';
    
    document.querySelectorAll('[data-direction]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDirection = btn.dataset.direction;
            document.querySelectorAll('[data-direction]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    const applyBtn = document.getElementById('apply-flip-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            try {
                const canvas = await flipImage(previewUrl, selectedDirection);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, originalFile.type));
                
                showResult(canvas, blob, 'flipped');
            } catch (error) {
                toast.error('Failed to flip image: ' + error.message);
            }
        });
    }
}

function createBatchSettings() {
    return `
        <h3>Batch Processing</h3>
        <div class="form-group">
            <label class="form-label" for="batch-operation">Operation</label>
            <select class="form-select" id="batch-operation">
                <option value="compress">Compress</option>
                <option value="convert">Convert</option>
                <option value="resize">Resize</option>
            </select>
        </div>
        <div class="form-group" id="batch-compress-settings">
            <label class="form-label" for="batch-quality">Quality</label>
            <input class="form-input" type="range" id="batch-quality" min="10" max="100" value="80">
        </div>
        <div class="form-group" id="batch-convert-settings" style="display: none;">
            <label class="form-label" for="batch-format">Format</label>
            <select class="form-select" id="batch-format">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
            </select>
        </div>
        <div class="form-group" id="batch-resize-settings" style="display: none;">
            <label class="form-label" for="batch-width">Max Width</label>
            <input class="form-input" type="number" id="batch-width" placeholder="e.g., 1920">
        </div>
    `;
}

function setupBatchListeners() {
    const operationSelect = document.getElementById('batch-operation');
    if (operationSelect) {
        operationSelect.addEventListener('change', () => {
            document.getElementById('batch-compress-settings').style.display = 
                operationSelect.value === 'compress' ? 'block' : 'none';
            document.getElementById('batch-convert-settings').style.display = 
                operationSelect.value === 'convert' ? 'block' : 'none';
            document.getElementById('batch-resize-settings').style.display = 
                operationSelect.value === 'resize' ? 'block' : 'none';
        });
    }
    
    const applyBtn = document.getElementById('apply-batch-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const operation = document.getElementById('batch-operation').value;
            
            try {
                for (const file of batchImages) {
                    const url = createObjectURL(file);
                    let resultBlob;
                    
                    if (operation === 'compress') {
                        const quality = parseInt(document.getElementById('batch-quality').value) / 100;
                        resultBlob = await compressImage(url, quality);
                    } else if (operation === 'convert') {
                        const format = document.getElementById('batch-format').value;
                        resultBlob = await convertImage(url, format);
                    } else if (operation === 'resize') {
                        const width = parseInt(document.getElementById('batch-width').value);
                        const canvas = await resizeImage(url, width || null, null, true);
                        resultBlob = await new Promise(resolve => canvas.toBlob(resolve, file.type));
                    }
                    
                    if (resultBlob) {
                        const fileName = file.name.replace(/\.[^.]+$/, '') + '_processed.' + 
                                        (operation === 'convert' ? getFileExtension(document.getElementById('batch-format').value) : 
                                         file.name.split('.').pop());
                        downloadBlob(resultBlob, fileName);
                    }
                    
                    revokeObjectURL(url);
                }
                
                toast.success('Batch processing complete!');
                sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 8);
            } catch (error) {
                toast.error('Batch processing failed: ' + error.message);
            }
        });
    }
}

function showResult(canvas, blob, operation) {
    const resultUrl = createObjectURL(blob);
    const preview = document.getElementById('image-preview');
    
    preview.innerHTML = `
        <img src="${resultUrl}" alt="Result" style="max-width: 100%; max-height: 400px;">
        <div class="result-info">
            <p>Original: ${formatBytes(originalFile.size)}</p>
            <p>Result: ${formatBytes(blob.size)}</p>
            <p>Saved: ${formatBytes(originalFile.size - blob.size)} (${((originalFile.size - blob.size) / originalFile.size * 100).toFixed(1)}%)</p>
        </div>
    `;
    
    const actionsContainer = document.getElementById('image-actions');
    actionsContainer.innerHTML = `
        <button class="btn btn-primary" id="download-result-btn">Download Result</button>
        <button class="btn" id="reset-image-btn">Reset</button>
    `;
    
    document.getElementById('download-result-btn').addEventListener('click', () => {
        const extension = blob.type === 'image/jpeg' ? 'jpg' : 
                        blob.type === 'image/png' ? 'png' : 
                        blob.type === 'image/webp' ? 'webp' : 'img';
        const fileName = originalFile.name.replace(/\.[^.]+$/, '') + '_' + operation + '.' + extension;
        downloadBlob(blob, fileName);
        toast.success('Image downloaded!');
        sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
    });
    
    document.getElementById('reset-image-btn').addEventListener('click', () => {
        handleFile(originalFile);
    });
}