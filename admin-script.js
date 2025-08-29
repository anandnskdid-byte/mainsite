// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC35qfMbaWyM1lr9ehE9QxuF2y3kcmpChA",
    authDomain: "db-shrikarni.firebaseapp.com",
    databaseURL: "https://db-shrikarni-default-rtdb.firebaseio.com",
    projectId: "db-shrikarni",
    storageBucket: "db-shrikarni.firebasestorage.app",
    messagingSenderId: "1044612421585",
    appId: "1:1044612421585:web:f6147f4c0fcdc46098b2f0",
    measurementId: "G-5N3TMGBPTP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

let slides = [];
let draggedElement = null;

// DOM Elements
const addSlideForm = document.getElementById('addSlideForm');
const slidesContainer = document.getElementById('slidesContainer');
const noSlides = document.getElementById('noSlides');
const statusMessages = document.getElementById('statusMessages');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSlides();
    setupEventListeners();
});

function setupEventListeners() {
    addSlideForm.addEventListener('submit', handleAddSlide);
    document.getElementById('imageUrl').addEventListener('input', handleImageUrlChange);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('saveAllBtn').addEventListener('click', saveAllSlides);
}

// Load slides from Firebase
function loadSlides() {
    database.ref('heroSlides').orderByChild('order').on('value', (snapshot) => {
        slides = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                slides.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        renderSlides();
    });
}

// Render slides in the admin interface
function renderSlides() {
    if (slides.length === 0) {
        slidesContainer.innerHTML = '';
        noSlides.classList.remove('hidden');
        return;
    }

    noSlides.classList.add('hidden');
    slidesContainer.innerHTML = slides.map((slide, index) => `
        <div class="sortable-item border border-gray-200 rounded-lg p-4 bg-gray-50" data-id="${slide.id}" draggable="true">
            <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                    <i class="fas fa-grip-vertical text-gray-400 cursor-move"></i>
                </div>
                <div class="flex-shrink-0">
                    <img src="${slide.imageUrl || '/placeholder.svg'}" alt="${slide.title}" class="w-20 h-20 object-cover rounded-lg">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                        <h3 class="text-lg font-medium text-gray-900 truncate">${slide.title || 'Untitled'}</h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${slide.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${slide.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 truncate">${slide.subtitle || ''}</p>
                    <div class="flex items-center space-x-3 mt-1">
                        <p class="text-xs text-gray-500">Order: ${index + 1}</p>
                        <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${slide.sliderType || 'slide'}</span>
                        <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">${slide.layoutType || 'fullscreen'}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="editSlide('${slide.id}')" class="text-blue-600 hover:text-blue-700 p-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleSlideActive('${slide.id}')" class="text-${slide.active ? 'yellow' : 'green'}-600 hover:text-${slide.active ? 'yellow' : 'green'}-700 p-2">
                        <i class="fas fa-${slide.active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button onclick="deleteSlide('${slide.id}')" class="text-red-600 hover:text-red-700 p-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    setupDragAndDrop();
}

// Handle add slide form submission
async function handleAddSlide(e) {
    e.preventDefault();
    
    const imageUrl = document.getElementById('imageUrl').value.trim();
    if (!imageUrl) {
        showMessage('Please enter an image URL', 'error');
        return;
    }

    // Validate URL format
    try {
        new URL(imageUrl);
    } catch (error) {
        showMessage('Please enter a valid image URL', 'error');
        return;
    }

    const slideData = {
        title: document.getElementById('slideTitle').value,
        subtitle: document.getElementById('slideSubtitle').value,
        description: document.getElementById('slideDescription').value,
        buttonText: document.getElementById('buttonText').value || 'Shop Now',
        buttonLink: document.getElementById('buttonLink').value || '/products',
        imageUrl: imageUrl,
        sliderType: document.getElementById('sliderType').value,
        layoutType: document.getElementById('layoutType').value,
        autoplay: parseInt(document.getElementById('autoplay').value) || 6,
        animationSpeed: parseInt(document.getElementById('animationSpeed').value) || 800,
        showNavigation: document.getElementById('showNavigation').checked,
        showDots: document.getElementById('showDots').checked,
        active: document.getElementById('slideActive').checked,
        order: slides.length,
        createdAt: Date.now()
    };

    try {
        showMessage('Adding slide...', 'info');
        
        // Save to Firebase
        await database.ref('heroSlides').push(slideData);
        
        showMessage('Slide added successfully!', 'success');
        addSlideForm.reset();
        resetImagePreview();
        
    } catch (error) {
        console.error('Error adding slide:', error);
        showMessage('Error adding slide: ' + error.message, 'error');
    }
}

// Upload image to Firebase Storage with better error handling
async function uploadImage(file, path) {
    try {
        // Create a unique filename
        const timestamp = Date.now();
        const fileName = `hero-slides/${timestamp}_${file.name}`;
        
        const storageRef = storage.ref(fileName);
        
        // Upload with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                'uploadedBy': 'admin-panel',
                'uploadedAt': new Date().toISOString()
            }
        };
        
        const snapshot = await storageRef.put(file, metadata);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log('Image uploaded successfully:', downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error('Upload error details:', error);
        
        // Fallback: Try uploading to a different path
        if (error.code === 'storage/unauthorized') {
            try {
                const fallbackRef = storage.ref(`images/${Date.now()}_${file.name}`);
                const fallbackSnapshot = await fallbackRef.put(file);
                return await fallbackSnapshot.ref.getDownloadURL();
            } catch (fallbackError) {
                throw new Error('Storage upload failed. Please check Firebase Storage rules.');
            }
        }
        
        throw error;
    }
}

// Edit slide (simplified version)
function editSlide(slideId) {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;

    const newTitle = prompt('Enter new title:', slide.title);
    const newSubtitle = prompt('Enter new subtitle:', slide.subtitle);
    
    if (newTitle !== null) {
        database.ref(`heroSlides/${slideId}`).update({
            title: newTitle,
            subtitle: newSubtitle || slide.subtitle,
            updatedAt: Date.now()
        });
        showMessage('Slide updated successfully!', 'success');
    }
}

// Delete slide
async function deleteSlide(slideId) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    
    try {
        await database.ref(`heroSlides/${slideId}`).remove();
        showMessage('Slide deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting slide:', error);
        showMessage('Error deleting slide: ' + error.message, 'error');
    }
}

// Toggle slide active status
async function toggleSlideActive(slideId) {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    try {
        await database.ref(`heroSlides/${slideId}`).update({
            active: !slide.active,
            updatedAt: Date.now()
        });
        showMessage(`Slide ${!slide.active ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (error) {
        console.error('Error toggling slide:', error);
        showMessage('Error updating slide: ' + error.message, 'error');
    }
}

// Image URL handlers
function handleImageUrlChange(e) {
    const imageUrl = e.target.value.trim();
    const previewImg = document.getElementById('previewImg');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageUrl) {
        // Validate URL format
        try {
            new URL(imageUrl);
            previewImg.src = imageUrl;
            imagePreview.classList.remove('hidden');
            
            // Handle image load errors
            previewImg.onload = function() {
                imagePreview.classList.remove('hidden');
            };
            
            previewImg.onerror = function() {
                imagePreview.classList.add('hidden');
                showMessage('Invalid image URL or image failed to load', 'warning');
            };
            
        } catch (error) {
            imagePreview.classList.add('hidden');
        }
    } else {
        imagePreview.classList.add('hidden');
    }
}

function resetImagePreview() {
    document.getElementById('imageUrl').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
}

// Show preview
function showPreview() {
    const activeSlides = slides.filter(slide => slide.active);
    if (activeSlides.length === 0) {
        showMessage('No active slides to preview', 'warning');
        return;
    }
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hero Slider Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                .slide { display: none; }
                .slide.active { display: block; }
            </style>
        </head>
        <body class="bg-gray-100">
            <div class="relative h-screen">
                ${activeSlides.map((slide, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''} absolute inset-0">
                        <img src="${slide.imageUrl}" alt="${slide.title}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div class="text-center text-white max-w-2xl px-6">
                                <h1 class="text-5xl font-bold mb-4">${slide.title}</h1>
                                <p class="text-2xl mb-4">${slide.subtitle}</p>
                                <p class="text-lg mb-8">${slide.description}</p>
                                <button class="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-semibold text-lg">
                                    ${slide.buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${activeSlides.length > 1 ? `
                    <button onclick="changeSlide(-1)" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full text-xl">
                        ‹
                    </button>
                    <button onclick="changeSlide(1)" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full text-xl">
                        ›
                    </button>
                ` : ''}
            </div>
            <script>
                let currentSlide = 0;
                const totalSlides = ${activeSlides.length};
                
                function changeSlide(direction) {
                    document.querySelectorAll('.slide')[currentSlide].classList.remove('active');
                    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
                    document.querySelectorAll('.slide')[currentSlide].classList.add('active');
                }
                
                // Auto-advance slides
                setInterval(() => changeSlide(1), 5000);
            </script>
        </body>
        </html>
    `);
}

// Save all slides (reorder)
async function saveAllSlides() {
    try {
        const updates = {};
        slides.forEach((slide, index) => {
            updates[`heroSlides/${slide.id}/order`] = index;
        });
        
        await database.ref().update(updates);
        showMessage('Slide order saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving slides:', error);
        showMessage('Error saving slides: ' + error.message, 'error');
    }
}

// Drag and drop functionality
function setupDragAndDrop() {
    const sortableItems = document.querySelectorAll('.sortable-item');
    
    sortableItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (this !== draggedElement) {
        const draggedId = draggedElement.dataset.id;
        const targetId = this.dataset.id;
        
        const draggedIndex = slides.findIndex(s => s.id === draggedId);
        const targetIndex = slides.findIndex(s => s.id === targetId);
        
        // Reorder slides array
        const [draggedSlide] = slides.splice(draggedIndex, 1);
        slides.splice(targetIndex, 0, draggedSlide);
        
        renderSlides();
        showMessage('Slides reordered. Click "Save All" to persist changes.', 'info');
    }
}

function handleDragEnd(e) {
    this.style.opacity = '';
    document.querySelectorAll('.sortable-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Show status messages
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    const bgColor = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700'
    };
    
    messageDiv.className = `border-l-4 p-4 mb-4 ${bgColor[type]}`;
    messageDiv.innerHTML = `
        <div class="flex">
            <div class="flex-shrink-0">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-400 hover:text-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    statusMessages.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}
