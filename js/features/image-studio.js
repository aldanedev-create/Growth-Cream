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
let resultUrl = null;
let batchImages = [];

let cropState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    cropArea: null,
    isMoving: false
};

export async function renderImageStudio(container) {
    container.innerHTML = `
        <div class="image-studio-container">
            <div class="section-header">
                <h2 class="section-title">🖼 Image Studio</h2>
            </div>
            
            <div class="image-tabs">
                <button type="button" class="btn ${currentOperation === 'resize' ? 'active' : ''}" data-op="resize">Resize</button>
                <button type="button" class="btn ${currentOperation === 'compress' ? 'active' : ''}" data-op="compress">Compress</button>
                <button type="button" class="btn ${currentOperation === 'crop' ? 'active' : ''}" data-op="crop">Crop</button>
                <button type="button" class="btn ${currentOperation === 'convert' ? 'active' : ''}" data-op="convert">Convert</button>
                <button type="button" class="btn ${currentOperation === 'rotate' ? 'active' : ''}" data-op="rotate">Rotate</button>
                <button type="button" class="btn ${currentOperation === 'flip' ? 'active' : ''}" data-op="flip">Flip</button>
                <button type="button" class="btn ${currentOperation === 'batch' ? 'active' : ''}" data-op="batch">Batch</button>
            </div>
            
            <div class="image-workspace">
                <div class="image-upload-area">
                    ${createDropzone()}
                </div>
                
                <div class="image-preview-area" id="image-preview-area" style="display: none;">
                    <div class="image-preview-header" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <h3 id="image-filename" style="margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px;"></h3>
                        <span id="image-dimensions" class="badge"></span>
                        <span id="image-size" class="badge"></span>
                    </div>
                    <div class="image-preview" id="image-preview" style="width: 100%; max-height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; margin: 15px 0;"></div>
                    <div class="image-actions" id="image-actions" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
                </div>
            </div>
            
            <div class="image-settings" id="image-settings" style="display: none;">
                <!-- Settings rendered dynamically -->
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
                <button type="button" class="btn btn-primary" id="choose-image-btn">Choose Image</button>
                <input type="file" id="file-input" accept="image/*" style="display: none;" ${currentOperation === 'batch' ? 'multiple' : ''}>
                <button type="button" class="btn btn-danger" id="clear-image-btn" style="display: none; margin-top: 10px;">
                    ✕ Remove Image
                </button>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    document.querySelectorAll('.image-tabs .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentOperation = btn.dataset.op;
            document.querySelectorAll('.image-tabs .btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                if (currentOperation === 'batch') {
                    fileInput.setAttribute('multiple', '');
                } else {
                    fileInput.removeAttribute('multiple');
                }
            }

            if (currentImage || batchImages.length > 0) {
                showSettings();
            }
        });
    });
    
    const chooseImageBtn = document.getElementById('choose-image-btn');
    const fileInput = document.getElementById('file-input');
    
    if (chooseImageBtn && fileInput) {
        chooseImageBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    }

    const clearImageBtn = document.getElementById('clear-image-btn');
    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', () => clearImage());
    }

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
    if (files && files.length > 0) {
        if (currentOperation === 'batch') {
            await handleBatchFiles(files);
        } else {
            await handleFile(files[0]);
        }
    }
}

function clearImage() {
    if (previewUrl) {
        revokeObjectURL(previewUrl);
        previewUrl = null;
    }
    if (resultUrl) {
        revokeObjectURL(resultUrl);
        resultUrl = null;
    }
    
    currentImage = null;
    originalFile = null;
    batchImages = [];
    cropState.cropArea = null;
    
    const previewArea = document.getElementById('image-preview-area');
    const settingsArea = document.getElementById('image-settings');
    const clearImageBtn = document.getElementById('clear-image-btn');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('image-preview');
    const actions = document.getElementById('image-actions');

    if (previewArea) previewArea.style.display = 'none';
    if (settingsArea) settingsArea.style.display = 'none';
    if (clearImageBtn) clearImageBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (preview) preview.innerHTML = '';
    if (actions) actions.innerHTML = '';
    
    toast.info('Image removed');
}

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
    }
    
    if (previewUrl) revokeObjectURL(previewUrl);
    if (resultUrl) {
        revokeObjectURL(resultUrl);
        resultUrl = null;
    }

    originalFile = file;
    currentImage = file;
    previewUrl = createObjectURL(file);
    
    try {
        const dimensions = await getImageDimensions(previewUrl);
        
        document.getElementById('image-preview-area').style.display = 'block';
        document.getElementById('image-settings').style.display = 'block';
        document.getElementById('image-filename').textContent = file.name;
        document.getElementById('image-dimensions').textContent = `${dimensions.width} × ${dimensions.height}`;
        document.getElementById('image-size').textContent = formatBytes(file.size);
        
        const previewHeader = document.querySelector('.image-preview-header');
        if (previewHeader) {
            const existingBtn = previewHeader.querySelector('.remove-image-btn');
            if (existingBtn) existingBtn.remove();
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-icon remove-image-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.title = 'Remove image';
            removeBtn.setAttribute('aria-label', 'Remove image');
            removeBtn.style.cssText = `
                margin-left: auto;
                background: rgba(248, 113, 113, 0.15);
                border: 1px solid rgba(248, 113, 113, 0.4);
                color: var(--error, #f87171);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 14px;
            `;
            removeBtn.onclick = () => clearImage();
            previewHeader.appendChild(removeBtn);
        }
        
        const clearBtn = document.getElementById('clear-image-btn');
        if (clearBtn) clearBtn.style.display = 'inline-block';
        
        showSettings();
        toast.success('Image loaded successfully');
    } catch (error) {
        toast.error('Failed to load image preview');
        clearImage();
    }
}

async function handleBatchFiles(files) {
    batchImages = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (batchImages.length === 0) {
        toast.error('No valid image files selected');
        return;
    }
    
    document.getElementById('image-preview-area').style.display = 'block';
    document.getElementById('image-settings').style.display = 'block';
    
    const clearBtn = document.getElementById('clear-image-btn');
    if (clearBtn) clearBtn.style.display = 'inline-block';

    document.getElementById('image-filename').textContent = `${batchImages.length} images selected`;
    document.getElementById('image-dimensions').textContent = '';
    document.getElementById('image-size').textContent = formatBytes(
        batchImages.reduce((acc, f) => acc + f.size, 0)
    );

    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div class="batch-list" style="width: 100%; max-height: 300px; overflow-y: auto;">
            ${batchImages.map((file, index) => `
                <div class="batch-item" data-index="${index}" style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span class="batch-name" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">${escapeHtml(file.name)}</span>
                    <span class="batch-size">${formatBytes(file.size)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    showSettings();
    toast.success(`${batchImages.length} images loaded for batching`);
}

function showSettings() {
    const settingsContainer = document.getElementById('image-settings');
    const actionsContainer = document.getElementById('image-actions');
    
    if (!settingsContainer || !actionsContainer) return;
    
    // Reset preview to original image when switching operations (except crop)
    if (currentOperation !== 'crop' && currentOperation !== 'batch' && previewUrl) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `
            <img src="${previewUrl}" alt="${escapeHtml(originalFile ? originalFile.name : 'Preview')}" 
                 style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
        `;
    }

    switch (currentOperation) {
        case 'resize':
            settingsContainer.innerHTML = createResizeSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-resize-btn">Apply Resize</button>';
            setupResizeListeners();
            break;
        case 'compress':
            settingsContainer.innerHTML = createCompressSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-compress-btn">Compress Image</button>';
            setupCompressListeners();
            break;
        case 'crop':
            settingsContainer.innerHTML = createCropSettings();
            actionsContainer.innerHTML = `
                <button type="button" class="btn btn-primary" id="apply-crop-btn">Apply Crop</button>
                <button type="button" class="btn" id="reset-crop-btn">Reset Selection</button>
            `;
            setupCropListeners();
            initializeInteractiveCrop();
            break;
        case 'convert':
            settingsContainer.innerHTML = createConvertSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-convert-btn">Convert Image</button>';
            setupConvertListeners();
            break;
        case 'rotate':
            settingsContainer.innerHTML = createRotateSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-rotate-btn">Apply Rotation</button>';
            setupRotateListeners();
            break;
        case 'flip':
            settingsContainer.innerHTML = createFlipSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-flip-btn">Apply Flip</button>';
            setupFlipListeners();
            break;
        case 'batch':
            settingsContainer.innerHTML = createBatchSettings();
            actionsContainer.innerHTML = '<button type="button" class="btn btn-primary" id="apply-batch-btn">Process Batch</button>';
            setupBatchListeners();
            break;
    }
}

function createResizeSettings() {
    return `
        <h3>Resize Image</h3>
        <div class="form-group">
            <label class="form-label">
                <input type="checkbox" id="maintain-aspect" checked> Maintain aspect ratio
            </label>
        </div>
        <div class="form-group">
            <label class="form-label" for="resize-width">Width (px)</label>
            <input class="form-input" type="number" id="resize-width" min="1" placeholder="Auto">
        </div>
        <div class="form-group">
            <label class="form-label" for="resize-height">Height (px)</label>
            <input class="form-input" type="number" id="resize-height" min="1" placeholder="Auto">
        </div>
    `;
}

function setupResizeListeners() {
    const applyBtn = document.getElementById('apply-resize-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const width = parseInt(document.getElementById('resize-width').value) || null;
            const height = parseInt(document.getElementById('resize-height').value) || null;
            const maintainAspect = document.getElementById('maintain-aspect').checked;
            
            if (!width && !height) {
                toast.error('Please enter a width or height');
                return;
            }
            
            try {
                const canvas = await resizeImage(previewUrl, width, height, maintainAspect);
                const blob = await canvasToBlob(canvas, originalFile.type);
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
                const tempUrl = createObjectURL(blob);
                const img = await loadImage(tempUrl);
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                revokeObjectURL(tempUrl);
                
                showResult(canvas, blob, 'compressed');
            } catch (error) {
                toast.error('Failed to compress image: ' + error.message);
            }
        });
    }
}

/* ============ INTERACTIVE CROP ============ */

function createCropSettings() {
    return `
        <h3>Interactive Crop</h3>
        <p class="text-muted" style="margin-bottom: 10px;">Drag on the image to select crop area</p>
        <div class="form-group">
            <label class="form-label" for="crop-preset">Aspect Ratio</label>
            <select class="form-select" id="crop-preset">
                <option value="free">Free</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="3:2">3:2</option>
                <option value="9:16">9:16 (Portrait)</option>
            </select>
        </div>
    `;
}

function initializeInteractiveCrop() {
    const preview = document.getElementById('image-preview');
    if (!preview || !currentImage || !previewUrl) return;
    
    preview.innerHTML = `
        <div class="crop-container" id="crop-container" style="position: relative; display: inline-block;">
            <img src="${previewUrl}" id="crop-image" alt="Crop" style="max-width: 100%; max-height: 400px; display: block;">
            <div class="crop-overlay" id="crop-overlay" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                cursor: crosshair;
            ">
                <div class="crop-selection" id="crop-selection" style="
                    position: absolute;
                    border: 2px solid var(--pink, #ff2bd6);
                    background: rgba(255, 43, 214, 0.1);
                    display: none;
                    cursor: move;
                    box-shadow: 0 0 0 1px rgba(255, 43, 214, 0.3);
                "></div>
            </div>
        </div>
    `;
    
    const cropOverlay = document.getElementById('crop-overlay');
    const cropSelection = document.getElementById('crop-selection');
    
    cropState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        cropArea: null,
        isMoving: false
    };
    
    // Mouse events
    cropOverlay.addEventListener('mousedown', startCrop);
    document.addEventListener('mousemove', updateCrop);
    document.addEventListener('mouseup', endCrop);
    
    // Touch events
    cropOverlay.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Reset crop button
    const resetBtn = document.getElementById('reset-crop-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            cropSelection.style.display = 'none';
            cropState.cropArea = null;
        });
    }
}

function startCrop(e) {
    const cropOverlay = document.getElementById('crop-overlay');
    const cropSelection = document.getElementById('crop-selection');
    if (!cropOverlay || !cropSelection) return;
    
    const rect = cropOverlay.getBoundingClientRect();
    
    cropState.isDragging = true;
    cropState.startX = e.clientX - rect.left;
    cropState.startY = e.clientY - rect.top;
    
    cropSelection.style.display = 'block';
    cropSelection.style.left = cropState.startX + 'px';
    cropSelection.style.top = cropState.startY + 'px';
    cropSelection.style.width = '0px';
    cropSelection.style.height = '0px';
}

function updateCrop(e) {
    if (!cropState.isDragging) return;
    
    const cropOverlay = document.getElementById('crop-overlay');
    const cropSelection = document.getElementById('crop-selection');
    const cropImage = document.getElementById('crop-image');
    if (!cropOverlay || !cropSelection || !cropImage) return;
    
    const rect = cropOverlay.getBoundingClientRect();
    
    cropState.currentX = e.clientX - rect.left;
    cropState.currentY = e.clientY - rect.top;
    
    let x = Math.min(cropState.startX, cropState.currentX);
    let y = Math.min(cropState.startY, cropState.currentY);
    let width = Math.abs(cropState.currentX - cropState.startX);
    let height = Math.abs(cropState.currentY - cropState.startY);
    
    // Apply aspect ratio if selected
    const preset = document.getElementById('crop-preset').value;
    if (preset !== 'free') {
        const ratio = getAspectRatio(preset);
        if (width / height > ratio) {
            width = height * ratio;
        } else {
            height = width / ratio;
        }
    }
    
    // Constrain to image bounds
    const imageRect = cropImage.getBoundingClientRect();
    const maxWidth = imageRect.width;
    const maxHeight = imageRect.height;
    
    if (x + width > maxWidth) width = maxWidth - x;
    if (y + height > maxHeight) height = maxHeight - y;
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    
    cropSelection.style.left = x + 'px';
    cropSelection.style.top = y + 'px';
    cropSelection.style.width = width + 'px';
    cropSelection.style.height = height + 'px';
    
    cropState.cropArea = { x, y, width, height };
}

function endCrop() {
    cropState.isDragging = false;
    
    // Hide selection if too small
    if (cropState.cropArea && (cropState.cropArea.width < 10 || cropState.cropArea.height < 10)) {
        const cropSelection = document.getElementById('crop-selection');
        if (cropSelection) cropSelection.style.display = 'none';
        cropState.cropArea = null;
    }
}

function getAspectRatio(preset) {
    const ratios = {
        '1:1': 1,
        '4:3': 4/3,
        '16:9': 16/9,
        '3:2': 3/2,
        '9:16': 9/16
    };
    return ratios[preset] || 1;
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    startCrop(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    updateCrop(mouseEvent);
}

function handleTouchEnd() {
    endCrop();
}

function setupCropListeners() {
    const applyBtn = document.getElementById('apply-crop-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            if (!cropState.cropArea) {
                toast.error('Please drag on the image to select crop area first');
                return;
            }
            
            const cropImageEl = document.getElementById('crop-image');
            if (!cropImageEl) return;
            
            // Convert screen coordinates to natural image coordinates
            const displayedWidth = cropImageEl.getBoundingClientRect().width;
            const displayedHeight = cropImageEl.getBoundingClientRect().height;
            const naturalWidth = cropImageEl.naturalWidth;
            const naturalHeight = cropImageEl.naturalHeight;
            
            const scaleX = naturalWidth / displayedWidth;
            const scaleY = naturalHeight / displayedHeight;
            
            const cropArea = {
                x: Math.round(cropState.cropArea.x * scaleX),
                y: Math.round(cropState.cropArea.y * scaleY),
                width: Math.round(cropState.cropArea.width * scaleX),
                height: Math.round(cropState.cropArea.height * scaleY)
            };
            
            try {
                const canvas = await cropImage(previewUrl, cropArea);
                const blob = await canvasToBlob(canvas, originalFile.type);
                showResult(canvas, blob, 'cropped');
            } catch (error) {
                toast.error('Failed to crop image: ' + error.message);
            }
        });
    }
}

/* ============ CONVERT ============ */

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
                const tempUrl = createObjectURL(blob);
                const img = await loadImage(tempUrl);
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                revokeObjectURL(tempUrl);
                
                showResult(canvas, blob, 'converted');
            } catch (error) {
                toast.error('Failed to convert image: ' + error.message);
            }
        });
    }
}

/* ============ ROTATE ============ */

function createRotateSettings() {
    return `
        <h3>Rotate Image</h3>
        <div class="form-group">
            <label class="form-label">Rotation Angle</label>
            <div class="button-group">
                <button type="button" class="btn active" data-angle="90">90°</button>
                <button type="button" class="btn" data-angle="180">180°</button>
                <button type="button" class="btn" data-angle="270">270°</button>
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
                const blob = await canvasToBlob(canvas, originalFile.type);
                showResult(canvas, blob, 'rotated');
            } catch (error) {
                toast.error('Failed to rotate image: ' + error.message);
            }
        });
    }
}

/* ============ FLIP ============ */

function createFlipSettings() {
    return `
        <h3>Flip Image</h3>
        <div class="form-group">
            <label class="form-label">Flip Direction</label>
            <div class="button-group">
                <button type="button" class="btn active" data-direction="horizontal">Horizontal</button>
                <button type="button" class="btn" data-direction="vertical">Vertical</button>
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
                const blob = await canvasToBlob(canvas, originalFile.type);
                showResult(canvas, blob, 'flipped');
            } catch (error) {
                toast.error('Failed to flip image: ' + error.message);
            }
        });
    }
}

/* ============ BATCH ============ */

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
            <label class="form-label" for="batch-quality">Quality: <span id="batch-quality-value">80%</span></label>
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
            <label class="form-label" for="batch-width">Max Width (px)</label>
            <input class="form-input" type="number" id="batch-width" placeholder="e.g., 1920" min="1">
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
    
    const qualitySlider = document.getElementById('batch-quality');
    const qualityValue = document.getElementById('batch-quality-value');
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value + '%';
        });
    }
    
    const applyBtn = document.getElementById('apply-batch-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const operation = document.getElementById('batch-operation').value;
            
            if (!batchImages || batchImages.length === 0) {
                toast.error('No images loaded for batch processing');
                return;
            }

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
                        const width = parseInt(document.getElementById('batch-width').value) || null;
                        const canvas = await resizeImage(url, width, null, true);
                        resultBlob = await canvasToBlob(canvas, file.type);
                    }
                    
                    if (resultBlob) {
                        const targetFormat = operation === 'convert' ? document.getElementById('batch-format').value : file.type;
                        const fileName = file.name.replace(/\.[^.]+$/, '') + '_processed.' + getFileExtension(targetFormat);
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

/* ============ RESULT ============ */

function showResult(canvas, blob, operation) {
    if (resultUrl) revokeObjectURL(resultUrl);
    resultUrl = createObjectURL(blob);
    
    const preview = document.getElementById('image-preview');
    const sizeDiff = originalFile.size - blob.size;
    const diffText = sizeDiff >= 0 
        ? `Saved: ${formatBytes(sizeDiff)} (${((sizeDiff / originalFile.size) * 100).toFixed(1)}%)`
        : `Increased by: ${formatBytes(Math.abs(sizeDiff))}`;

    preview.innerHTML = `
        <img src="${resultUrl}" alt="Result" style="max-width: 100%; max-height: 320px; object-fit: contain; border-radius: 8px;">
        <div class="result-info" style="margin-top: 10px; text-align: center; font-size: 0.9em; opacity: 0.9;">
            <p style="margin: 2px 0;">Original: ${formatBytes(originalFile.size)} | Result: ${formatBytes(blob.size)}</p>
            <p style="margin: 2px 0;">${diffText}</p>
        </div>
    `;
    
    const actionsContainer = document.getElementById('image-actions');
    actionsContainer.innerHTML = `
        <button type="button" class="btn btn-primary" id="download-result-btn">Download Result</button>
        <button type="button" class="btn" id="reset-image-btn">Reset</button>
        <button type="button" class="btn btn-danger" id="remove-image-btn">Remove Image</button>
    `;
    
    document.getElementById('download-result-btn').addEventListener('click', () => {
        const extension = getFileExtension(blob.type);
        const fileName = originalFile.name.replace(/\.[^.]+$/, '') + '_' + operation + '.' + extension;
        downloadBlob(blob, fileName);
        toast.success('Image downloaded!');
        sparks.burst(window.innerWidth / 2, window.innerHeight / 2, 5);
    });
    
    document.getElementById('reset-image-btn').addEventListener('click', () => {
        handleFile(originalFile);
    });

    document.getElementById('remove-image-btn').addEventListener('click', () => {
        clearImage();
    });
}

/* ============ UTILITIES ============ */

function canvasToBlob(canvas, type = 'image/png') {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob conversion failed'));
        }, type);
    });
}

function getFileExtension(mimeType) {
    switch (mimeType) {
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/webp': return 'webp';
        default: return 'img';
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}