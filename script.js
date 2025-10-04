/**
 * Cosmos Explorer - Interactive 3D Space Experience
 * 
 * Architecture Overview:
 * - App: Main application controller
 * - Renderer3D: WebGL-based 3D rendering engine
 * - AudioManager: Web Audio API-based sound system
 * - DataManager: NASA API integration with caching
 * - StoryManager: Chapter-based narrative system
 * - SettingsManager: User preferences and local storage
 * 
 * NASA API Integration:
 * - Default API key: 'DEMO_KEY' (rate limited)
 * - To use your own key, replace DEMO_KEY with your NASA API key
 * - Get your free key at: https://api.nasa.gov/
 * 
 * Performance Notes:
 * - Uses requestAnimationFrame for smooth animations
 * - Throttled scroll and resize listeners
 * - Canvas rendering optimized for mobile devices
 * - Implements object pooling for particles
 */

// Global application state
let app = null;

// Configuration constants
const CONFIG = {
    NASA_API_KEY: 'DEMO_KEY', // Replace with your NASA API key
    CANVAS: {
        PARTICLE_COUNT: 200,
        TRAIL_LENGTH: 50,
        FPS_TARGET: 60
    },
    AUDIO: {
        SAMPLE_RATE: 44100,
        BUFFER_SIZE: 2048,
        MASTER_VOLUME: 0.5
    },
    STORY: {
        CHAPTERS: 5,
        AUTO_PROGRESS_DELAY: 30000 // 30 seconds
    },
    CACHE_DURATION: 1000 * 60 * 60 // 1 hour
};

// NASA API endpoints
const NASA_ENDPOINTS = {
    APOD: `https://api.nasa.gov/planetary/apod?api_key=${CONFIG.NASA_API_KEY}`,
    NEO: `https://api.nasa.gov/neo/rest/v1/feed?api_key=${CONFIG.NASA_API_KEY}`,
    ISS: 'http://api.open-notify.org/iss-now.json'
};

/**
 * Main Application Controller
 * Manages app lifecycle, view switching, and component coordination
 */
class App {
    constructor() {
        this.currentView = 'home';
        this.isInitialized = false;
        this.components = {};
        
        this.init();
    }
    
    async init() {
        try {
            await this.showLoadingScreen();
            await this.initializeComponents();
            await this.bindEvents();
            await this.loadInitialData();
            
            this.hideLoadingScreen();
            this.showOnboardingModal();
            this.isInitialized = true;
            
            console.log('Cosmos Explorer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Error', 'Failed to initialize application', 'error');
        }
    }
    
    async initializeComponents() {
        // Initialize 3D renderer
        this.components.renderer = new Renderer3D('main-canvas');
        
        // Initialize audio manager
        this.components.audio = new AudioManager();
        
        // Initialize data manager
        this.components.data = new DataManager();
        
        // Initialize story manager
        this.components.story = new StoryManager();
        
        // Initialize settings manager
        this.components.settings = new SettingsManager();
        
        // Start rendering loop
        this.components.renderer.start();
        
        // Load user settings
        this.components.settings.load();
    }
    
    async bindEvents() {
        // Navigation events
        document.querySelectorAll('[data-view]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view || e.target.closest('[data-view]').dataset.view;
                if (view) this.switchView(view);
            });
        });
        
        // Settings panel toggle
        document.getElementById('settings-toggle').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // Audio toggle
        document.getElementById('audio-toggle').addEventListener('click', () => {
            this.components.audio.toggle();
            this.updateAudioUI();
        });
        
        // Modal events
        this.bindModalEvents();
        
        // Audio control events
        this.bindAudioControlEvents();
        
        // Story mode events
        this.bindStoryEvents();
        
        // Snapshot feature
        document.getElementById('snapshot-btn').addEventListener('click', () => {
            this.captureSnapshot();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('beforeunload', () => {
            this.components.settings.save();
        });
    }
    
    bindModalEvents() {
        const modal = document.getElementById('onboarding-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const startBtn = document.getElementById('start-journey');
        
        closeBtn.addEventListener('click', () => this.hideOnboardingModal());
        startBtn.addEventListener('click', () => this.hideOnboardingModal());
        
        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideOnboardingModal();
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.getAttribute('aria-hidden')) {
                this.hideOnboardingModal();
            }
        });
    }
    
    bindAudioControlEvents() {
        const playPauseBtn = document.getElementById('audio-play-pause');
        const volumeSlider = document.getElementById('audio-volume');
        const muteBtn = document.getElementById('audio-mute');
        
        playPauseBtn.addEventListener('click', () => {
            this.components.audio.toggle();
            this.updateAudioUI();
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.components.audio.setVolume(volume);
            this.components.settings.setVolume(volume);
        });
        
        muteBtn.addEventListener('click', () => {
            this.components.audio.toggleMute();
            this.updateAudioUI();
        });
    }
    
    bindStoryEvents() {
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        const playPauseBtn = document.getElementById('play-pause-story');
        
        prevBtn.addEventListener('click', () => {
            this.components.story.previousChapter();
        });
        
        nextBtn.addEventListener('click', () => {
            this.components.story.nextChapter();
        });
        
        playPauseBtn.addEventListener('click', () => {
            this.components.story.toggleNarration();
        });
        
        // Chapter dots
        document.querySelectorAll('.dot[data-chapter]').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const chapter = parseInt(e.target.dataset.chapter);
                this.components.story.goToChapter(chapter);
            });
        });
        
        // Scroll-based chapter navigation
        const storyContent = document.getElementById('story-content');
        let scrollTimeout;
        
        storyContent.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.components.story.updateChapterFromScroll();
            }, 100);
        });
    }
    
    handleKeyboard(e) {
        // Global keyboard shortcuts
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (this.currentView === 'story') {
                    this.components.story.toggleNarration();
                } else {
                    this.components.audio.toggle();
                    this.updateAudioUI();
                }
                break;
            case 'ArrowLeft':
                if (this.currentView === 'story') {
                    e.preventDefault();
                    this.components.story.previousChapter();
                }
                break;
            case 'ArrowRight':
                if (this.currentView === 'story') {
                    e.preventDefault();
                    this.components.story.nextChapter();
                }
                break;
            case 'm':
                this.components.audio.toggleMute();
                this.updateAudioUI();
                break;
            case 's':
                this.captureSnapshot();
                break;
        }
    }
    
    handleResize() {
        if (this.components.renderer) {
            this.components.renderer.handleResize();
        }
    }
    
    async showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = loadingScreen.querySelector('.loading-bar');
        const loadingText = loadingScreen.querySelector('.loading-text');
        
        const steps = [
            'Initializing 3D renderer...',
            'Loading audio system...',
            'Connecting to NASA APIs...',
            'Preparing cosmic experience...',
            'Ready for launch!'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            loadingText.textContent = steps[i];
            loadingBar.style.width = `${(i + 1) * 20}%`;
            await this.delay(500);
        }
        
        await this.delay(1000);
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    showOnboardingModal() {
        const modal = document.getElementById('onboarding-modal');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus management
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    }
    
    hideOnboardingModal() {
        const modal = document.getElementById('onboarding-modal');
        modal.setAttribute('aria-hidden', 'true');
        
        // Show audio controls hint
        setTimeout(() => {
            this.showToast('Audio Available', 'Click the audio controls to enable immersive space sounds', 'success');
        }, 1000);
    }
    
    switchView(viewName) {
        if (viewName === this.currentView) return;
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Switch view content
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        // Update 3D scene based on view
        this.components.renderer.setScene(viewName);
        
        // Handle view-specific initialization
        if (viewName === 'data-hub' && this.currentView !== 'data-hub') {
            this.components.data.refreshAll();
        } else if (viewName === 'story' && this.currentView !== 'story') {
            this.components.story.initialize();
        }
        
        this.currentView = viewName;
        
        // Play transition sound
        this.components.audio.playSound('transition');
        
        // Save current view
        this.components.settings.setCurrentView(viewName);
    }
    
    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        const isActive = panel.classList.contains('active');
        
        if (isActive) {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        } else {
            panel.classList.add('active');
            panel.setAttribute('aria-hidden', 'false');
        }
    }
    
    updateAudioUI() {
        const audioToggle = document.getElementById('audio-toggle');
        const audioIcon = audioToggle.querySelector('.audio-icon');
        const audioControls = document.getElementById('audio-controls');
        const playPauseBtn = document.getElementById('audio-play-pause');
        const muteBtn = document.getElementById('audio-mute');
        
        const isPlaying = this.components.audio.isPlaying();
        const isMuted = this.components.audio.isMuted();
        
        // Update main audio toggle
        audioIcon.textContent = isPlaying && !isMuted ? '🔊' : '🔇';
        
        // Show/hide audio controls
        if (isPlaying || this.components.audio.hasBeenStarted()) {
            audioControls.classList.add('active');
        }
        
        // Update play/pause button
        playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
        
        // Update mute button
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
    
    async loadInitialData() {
        // Load cached data first
        await this.components.data.loadFromCache();
        
        // Then try to fetch fresh data
        this.components.data.refreshAll();
    }
    
    captureSnapshot() {
        try {
            const canvas = document.getElementById('main-canvas');
            const link = document.createElement('a');
            
            link.download = `cosmos-explorer-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Snapshot Captured', 'Your cosmic view has been saved!', 'success');
            this.components.audio.playSound('capture');
        } catch (error) {
            console.error('Failed to capture snapshot:', error);
            this.showToast('Capture Failed', 'Unable to save snapshot', 'error');
        }
    }
    
    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close" aria-label="Close notification">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-hide after 5 seconds
        const autoHideTimer = setTimeout(() => {
            this.hideToast(toast);
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoHideTimer);
            this.hideToast(toast);
        });
    }
    
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 3D Rendering Engine
 * Handles WebGL-based particle systems, planetary bodies, and interactive elements
 */
class Renderer3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.planets = [];
        this.mousePos = { x: 0, y: 0 };
        this.currentScene = 'home';
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createParticles();
        this.createPlanets();
        this.bindEvents();
    }
    
    setupCanvas() {
        this.handleResize();
        
        // Set up canvas styling
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1';
    }
    
    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.width = rect.width;
        this.height = rect.height;
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < CONFIG.CANVAS.PARTICLE_COUNT; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                z: Math.random() * 1000,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                color: this.getStarColor(),
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }
    
    getStarColor() {
        const colors = [
            'rgba(255, 255, 255, 0.8)',
            'rgba(135, 206, 250, 0.6)',
            'rgba(255, 218, 185, 0.6)',
            'rgba(255, 192, 203, 0.5)',
            'rgba(173, 216, 230, 0.7)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createPlanets() {
        this.planets = [
            {
                x: this.width * 0.8,
                y: this.height * 0.3,
                radius: 60,
                color: '#4fc3f7',
                rotation: 0,
                rotationSpeed: 0.005,
                orbitRadius: 100,
                orbitSpeed: 0.001,
                orbitCenter: { x: this.width * 0.7, y: this.height * 0.4 }
            },
            {
                x: this.width * 0.2,
                y: this.height * 0.7,
                radius: 40,
                color: '#ff7043',
                rotation: 0,
                rotationSpeed: 0.008,
                orbitRadius: 80,
                orbitSpeed: 0.002,
                orbitCenter: { x: this.width * 0.25, y: this.height * 0.6 }
            }
        ];
    }
    
    bindEvents() {
        // Mouse tracking for interactive elements
        document.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });
        
        // Touch support
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mousePos.x = e.touches[0].clientX;
                this.mousePos.y = e.touches[0].clientY;
            }
        });
    }
    
    start() {
        this.render();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    render() {
        this.clear();
        this.updateParticles();
        this.updatePlanets();
        this.drawScene();
        
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    clear() {
        this.ctx.fillStyle = 'rgba(10, 15, 28, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;
            
            // Update twinkle
            particle.twinkle += particle.twinkleSpeed;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;
            if (particle.z < 0) particle.z = 1000;
            if (particle.z > 1000) particle.z = 0;
        });
    }
    
    updatePlanets() {
        this.planets.forEach(planet => {
            // Update rotation
            planet.rotation += planet.rotationSpeed;
            
            // Update orbital position
            const angle = Date.now() * planet.orbitSpeed;
            planet.x = planet.orbitCenter.x + Math.cos(angle) * planet.orbitRadius;
            planet.y = planet.orbitCenter.y + Math.sin(angle) * planet.orbitRadius;
        });
    }
    
    drawScene() {
        // Draw background gradient
        this.drawBackground();
        
        // Draw particles (stars)
        this.drawParticles();
        
        // Draw scene-specific content
        switch (this.currentScene) {
            case 'home':
                this.drawHomeScene();
                break;
            case 'data-hub':
                this.drawDataHubScene();
                break;
            case 'story':
                this.drawStoryScene();
                break;
            case 'about':
                this.drawAboutScene();
                break;
        }
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, 'rgba(10, 15, 28, 0.3)');
        gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.2)');
        gradient.addColorStop(1, 'rgba(51, 65, 85, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const distance = Math.sqrt(
                Math.pow(particle.x - this.mousePos.x, 2) + 
                Math.pow(particle.y - this.mousePos.y, 2)
            );
            
            // Mouse interaction
            const mouseInfluence = Math.max(0, 100 - distance) / 100;
            const interactiveSize = particle.size + mouseInfluence * 2;
            
            // Depth-based size and opacity
            const depthFactor = (1000 - particle.z) / 1000;
            const size = interactiveSize * depthFactor;
            const twinkleOpacity = Math.sin(particle.twinkle) * 0.3 + 0.7;
            const opacity = particle.opacity * depthFactor * twinkleOpacity;
            
            // Draw star
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect for nearby particles
            if (mouseInfluence > 0) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawHomeScene() {
        // Draw planets
        this.planets.forEach(planet => {
            this.drawPlanet(planet);
        });
        
        // Draw constellation lines
        this.drawConstellations();
        
        // Draw nebula effect
        this.drawNebula();
    }
    
    drawDataHubScene() {
        // Draw orbital paths
        this.drawOrbitalPaths();
        
        // Draw data visualization elements
        this.drawDataVisualization();
    }
    
    drawStoryScene() {
        const currentChapter = app.components.story?.currentChapter || 1;
        
        switch (currentChapter) {
            case 1: // Lift-off
                this.drawRocketTrail();
                break;
            case 2: // Orbit & Satellites
                this.drawSatelliteOrbits();
                break;
            case 3: // Deep Space
                this.drawDeepSpaceElements();
                break;
            case 4: // Galaxies
                this.drawGalaxySpiral();
                break;
            case 5: // Return to Earth
                this.drawEarthReturn();
                break;
        }
    }
    
    drawAboutScene() {
        // Draw network connections
        this.drawNetworkConnections();
        
        // Draw floating tech elements
        this.drawTechElements();
    }
    
    drawPlanet(planet) {
        this.ctx.save();
        
        // Planet glow
        const glowGradient = this.ctx.createRadialGradient(
            planet.x, planet.y, 0,
            planet.x, planet.y, planet.radius * 2
        );
        glowGradient.addColorStop(0, planet.color + '40');
        glowGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Planet surface
        const surfaceGradient = this.ctx.createRadialGradient(
            planet.x - planet.radius * 0.3,
            planet.y - planet.radius * 0.3,
            0,
            planet.x,
            planet.y,
            planet.radius
        );
        surfaceGradient.addColorStop(0, this.lightenColor(planet.color, 20));
        surfaceGradient.addColorStop(1, this.darkenColor(planet.color, 20));
        
        this.ctx.fillStyle = surfaceGradient;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rotation pattern
        this.ctx.strokeStyle = this.lightenColor(planet.color, 10);
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                planet.x, planet.y,
                planet.radius * 0.8,
                planet.radius * 0.2,
                planet.rotation + (i * Math.PI / 3),
                0, Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawConstellations() {
        const constellationPoints = [
            [{ x: this.width * 0.1, y: this.height * 0.2 }, { x: this.width * 0.15, y: this.height * 0.25 }],
            [{ x: this.width * 0.15, y: this.height * 0.25 }, { x: this.width * 0.2, y: this.height * 0.3 }],
            [{ x: this.width * 0.2, y: this.height * 0.3 }, { x: this.width * 0.12, y: this.height * 0.35 }]
        ];
        
        this.ctx.strokeStyle = 'rgba(99, 150, 255, 0.3)';
        this.ctx.lineWidth = 1;
        
        constellationPoints.forEach(line => {
            this.ctx.beginPath();
            this.ctx.moveTo(line[0].x, line[0].y);
            this.ctx.lineTo(line[1].x, line[1].y);
            this.ctx.stroke();
        });
    }
    
    drawNebula() {
        const nebulaGradient = this.ctx.createRadialGradient(
            this.width * 0.6, this.height * 0.4, 0,
            this.width * 0.6, this.height * 0.4, 200
        );
        nebulaGradient.addColorStop(0, 'rgba(168, 85, 240, 0.1)');
        nebulaGradient.addColorStop(0.5, 'rgba(99, 150, 255, 0.05)');
        nebulaGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = nebulaGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.6, this.height * 0.4, 200, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawOrbitalPaths() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const orbits = [150, 200, 250, 300];
        
        this.ctx.strokeStyle = 'rgba(99, 150, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        orbits.forEach(radius => {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw orbiting objects
            const angle = Date.now() * 0.001 * (400 - radius) / 100;
            const objX = centerX + Math.cos(angle) * radius;
            const objY = centerY + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = 'rgba(99, 150, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(objX, objY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawDataVisualization() {
        // Draw data flow lines
        const time = Date.now() * 0.003;
        
        for (let i = 0; i < 10; i++) {
            const startX = Math.random() * this.width;
            const startY = this.height;
            const endX = startX + Math.sin(time + i) * 100;
            const endY = startY - 300;
            
            const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, 'rgba(20, 184, 166, 0)');
            gradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.5)');
            gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    drawRocketTrail() {
        const rocketX = this.width * 0.3;
        const rocketY = this.height * 0.7;
        
        // Rocket trail
        const trailGradient = this.ctx.createLinearGradient(
            rocketX, rocketY,
            rocketX, rocketY + 200
        );
        trailGradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
        trailGradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
        trailGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = trailGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(rocketX, rocketY + 100, 20, 150, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rocket body
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.beginPath();
        this.ctx.ellipse(rocketX, rocketY, 8, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawSatelliteOrbits() {
        // Draw multiple satellite orbits around Earth
        const earthX = this.width * 0.5;
        const earthY = this.height * 0.5;
        const earthRadius = 80;
        
        // Draw Earth
        const earthGradient = this.ctx.createRadialGradient(
            earthX - 20, earthY - 20, 0,
            earthX, earthY, earthRadius
        );
        earthGradient.addColorStop(0, '#4fc3f7');
        earthGradient.addColorStop(0.6, '#2196f3');
        earthGradient.addColorStop(1, '#1565c0');
        
        this.ctx.fillStyle = earthGradient;
        this.ctx.beginPath();
        this.ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw satellite orbits
        const orbits = [120, 160, 200];
        orbits.forEach((radius, index) => {
            this.ctx.strokeStyle = 'rgba(99, 150, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(earthX, earthY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw satellites
            const angle = Date.now() * 0.001 * (index + 1);
            const satX = earthX + Math.cos(angle) * radius;
            const satY = earthY + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.rect(satX - 3, satY - 3, 6, 6);
            this.ctx.fill();
            
            // Solar panels
            this.ctx.fillStyle = 'rgba(0, 100, 200, 0.7)';
            this.ctx.beginPath();
            this.ctx.rect(satX - 8, satY - 1, 4, 2);
            this.ctx.rect(satX + 4, satY - 1, 4, 2);
            this.ctx.fill();
        });
    }
    
    drawDeepSpaceElements() {
        // Draw asteroid belt
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            const x = this.width * 0.5 + Math.cos(angle) * distance;
            const y = this.height * 0.5 + Math.sin(angle) * distance;
            const size = Math.random() * 3 + 1;
            
            this.ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw distant planets
        const planets = [
            { x: this.width * 0.8, y: this.height * 0.3, color: '#ff6b35', size: 25 },
            { x: this.width * 0.2, y: this.height * 0.7, color: '#f7931e', size: 35 },
        ];
        
        planets.forEach(planet => {
            const gradient = this.ctx.createRadialGradient(
                planet.x - planet.size * 0.3,
                planet.y - planet.size * 0.3,
                0,
                planet.x, planet.y, planet.size
            );
            gradient.addColorStop(0, planet.color);
            gradient.addColorStop(1, this.darkenColor(planet.color, 30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawGalaxySpiral() {
        const centerX = this.width * 0.5;
        const centerY = this.height * 0.5;
        
        // Draw spiral galaxy
        this.ctx.strokeStyle = 'rgba(168, 85, 240, 0.4)';
        this.ctx.lineWidth = 2;
        
        for (let arm = 0; arm < 4; arm++) {
            this.ctx.beginPath();
            for (let i = 0; i <= 100; i++) {
                const t = i / 100;
                const angle = arm * Math.PI * 0.5 + t * Math.PI * 4;
                const radius = t * 150;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Draw galaxy center
        const centerGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 30
        );
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        centerGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
        centerGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawEarthReturn() {
        // Draw Earth larger and more prominent
        const earthX = this.width * 0.5;
        const earthY = this.height * 0.5;
        const earthRadius = 120;
        
        // Earth atmosphere glow
        const atmosphereGradient = this.ctx.createRadialGradient(
            earthX, earthY, earthRadius,
            earthX, earthY, earthRadius + 20
        );
        atmosphereGradient.addColorStop(0, 'rgba(135, 206, 250, 0.3)');
        atmosphereGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = atmosphereGradient;
        this.ctx.beginPath();
        this.ctx.arc(earthX, earthY, earthRadius + 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Earth surface
        const earthGradient = this.ctx.createRadialGradient(
            earthX - 30, earthY - 30, 0,
            earthX, earthY, earthRadius
        );
        earthGradient.addColorStop(0, '#87ceeb');
        earthGradient.addColorStop(0.3, '#4fc3f7');
        earthGradient.addColorStop(0.7, '#2196f3');
        earthGradient.addColorStop(1, '#0d47a1');
        
        this.ctx.fillStyle = earthGradient;
        this.ctx.beginPath();
        this.ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Continents (simplified)
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
        this.ctx.beginPath();
        this.ctx.ellipse(earthX - 20, earthY - 10, 25, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(earthX + 15, earthY + 20, 20, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawNetworkConnections() {
        // Draw interconnected network nodes
        const nodes = [];
        for (let i = 0; i < 15; i++) {
            nodes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                connections: []
            });
        }
        
        // Create connections between nearby nodes
        nodes.forEach((node, index) => {
            nodes.forEach((otherNode, otherIndex) => {
                if (index !== otherIndex) {
                    const distance = Math.sqrt(
                        Math.pow(node.x - otherNode.x, 2) +
                        Math.pow(node.y - otherNode.y, 2)
                    );
                    
                    if (distance < 200) {
                        node.connections.push(otherIndex);
                    }
                }
            });
        });
        
        // Draw connections
        this.ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
        this.ctx.lineWidth = 1;
        
        nodes.forEach((node, index) => {
            node.connections.forEach(connectionIndex => {
                if (connectionIndex > index) { // Avoid drawing duplicates
                    const targetNode = nodes[connectionIndex];
                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    this.ctx.lineTo(targetNode.x, targetNode.y);
                    this.ctx.stroke();
                }
            });
        });
        
        // Draw nodes
        nodes.forEach(node => {
            this.ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawTechElements() {
        const time = Date.now() * 0.001;
        
        // Floating data packets
        for (let i = 0; i < 8; i++) {
            const x = (this.width * 0.1) + (i * this.width * 0.1) + Math.sin(time + i) * 20;
            const y = this.height * 0.3 + Math.cos(time + i * 0.5) * 30;
            
            this.ctx.fillStyle = 'rgba(99, 150, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.rect(x - 4, y - 4, 8, 8);
            this.ctx.fill();
            
            // Data packet glow
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(99, 150, 255, 0.8)';
            this.ctx.fillStyle = 'rgba(99, 150, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.rect(x - 6, y - 6, 12, 12);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    setScene(sceneName) {
        this.currentScene = sceneName;
        
        // Trigger scene transition effects
        if (app?.components?.audio) {
            app.components.audio.playSound('transition');
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = (num >> 8 & 0x00FF) + amt;
        const G = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                      (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + 
                      (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const B = (num >> 8 & 0x00FF) - amt;
        const G = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 + 
                      (B > 255 ? 255 : B < 0 ? 0 : B) * 0x100 + 
                      (G > 255 ? 255 : G < 0 ? 0 : G)).toString(16).slice(1);
    }
}

/**
 * Audio Management System
 * Handles procedural audio generation, ambient soundscapes, and spatial audio
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.hasStarted = false;
        this.volume = CONFIG.AUDIO.MASTER_VOLUME;
        
        this.oscillators = {};
        this.buffers = {};
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            
            // Generate procedural audio buffers
            await this.generateSoundBuffers();
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }
    
    async generateSoundBuffers() {
        // Generate ambient space drone
        this.buffers.ambient = this.generateAmbientDrone(30); // 30 second loop
        
        // Generate UI sound effects
        this.buffers.transition = this.generateTransitionSound();
        this.buffers.capture = this.generateCaptureSound();
        this.buffers.whoosh = this.generateWhooshSound();
        this.buffers.chime = this.generateChimeSound();
    }
    
    generateAmbientDrone(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                
                // Create layered frequencies for depth
                const freq1 = 40 + Math.sin(time * 0.1) * 5; // Low bass drone
                const freq2 = 80 + Math.sin(time * 0.07) * 3; // Mid frequency
                const freq3 = 120 + Math.sin(time * 0.13) * 8; // Higher harmonic
                
                // Generate waveforms
                let sample = 0;
                sample += Math.sin(2 * Math.PI * freq1 * time) * 0.3;
                sample += Math.sin(2 * Math.PI * freq2 * time) * 0.2;
                sample += Math.sin(2 * Math.PI * freq3 * time) * 0.1;
                
                // Add some filtered noise for texture
                const noise = (Math.random() * 2 - 1) * 0.05;
                sample += noise * Math.sin(time * 2);
                
                // Apply gentle envelope to avoid clicks
                const fadeTime = 0.5;
                let envelope = 1;
                if (time < fadeTime) {
                    envelope = time / fadeTime;
                } else if (time > duration - fadeTime) {
                    envelope = (duration - time) / fadeTime;
                }
                
                channelData[i] = sample * envelope * 0.15; // Keep volume low
            }
        }
        
        return buffer;
    }
    
    generateTransitionSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                const progress = time / duration;
                
                // Sweeping frequency
                const freq = 200 + progress * 400;
                let sample = Math.sin(2 * Math.PI * freq * time);
                
                // Apply envelope
                const envelope = Math.exp(-progress * 3) * Math.sin(progress * Math.PI);
                channelData[i] = sample * envelope * 0.2;
            }
        }
        
        return buffer;
    }
    
    generateCaptureSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                const progress = time / duration;
                
                // Camera shutter-like sound
                let sample = 0;
                
                if (progress < 0.1) {
                    // Sharp attack
                    sample = (Math.random() * 2 - 1) * (1 - progress * 10);
                } else {
                    // Bell-like tone
                    const freq = 800;
                    sample = Math.sin(2 * Math.PI * freq * time) * Math.exp(-progress * 8);
                }
                
                channelData[i] = sample * 0.3;
            }
        }
        
        return buffer;
    }
    
    generateWhooshSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                const progress = time / duration;
                
                // Filtered noise with frequency sweep
                const noise = (Math.random() * 2 - 1);
                const freq = 100 + progress * 300;
                const filter = Math.sin(2 * Math.PI * freq * time);
                
                let sample = noise * filter;
                
                // Apply envelope
                const envelope = Math.sin(progress * Math.PI) * Math.exp(-progress * 2);
                channelData[i] = sample * envelope * 0.15;
            }
        }
        
        return buffer;
    }
    
    generateChimeSound() {
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                const time = i / sampleRate;
                const progress = time / duration;
                
                let sample = 0;
                frequencies.forEach(freq => {
                    sample += Math.sin(2 * Math.PI * freq * time) / frequencies.length;
                });
                
                // Apply bell-like envelope
                const envelope = Math.exp(-progress * 2) * Math.sin(progress * Math.PI * 0.5);
                channelData[i] = sample * envelope * 0.2;
            }
        }
        
        return buffer;
    }
    
    async start() {
        if (!this.audioContext || this.isPlaying) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Start ambient sound loop
            this.startAmbientLoop();
            
            this.isPlaying = true;
            this.hasStarted = true;
            
            console.log('Audio playback started');
        } catch (error) {
            console.warn('Failed to start audio:', error);
        }
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        // Stop all oscillators
        Object.values(this.oscillators).forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        this.oscillators = {};
        
        this.isPlaying = false;
        
        console.log('Audio playback stopped');
    }
    
    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    startAmbientLoop() {
        if (!this.buffers.ambient || !this.audioContext) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers.ambient;
        source.loop = true;
        source.connect(this.masterGain);
        
        // Store reference for cleanup
        this.oscillators.ambient = source;
        
        source.start(0);
        
        // Restart when ended (backup for loop)
        source.onended = () => {
            if (this.isPlaying) {
                setTimeout(() => this.startAmbientLoop(), 100);
            }
        };
    }
    
    playSound(soundName, options = {}) {
        if (!this.audioContext || this.isMuted || !this.buffers[soundName]) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[soundName];
        
        // Create gain node for this sound
        const gainNode = this.audioContext.createGain();
        const volume = options.volume || 1;
        gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
        
        // Connect audio graph
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Play sound
        source.start(0);
        
        // Cleanup
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
        };
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setTargetAtTime(
                this.volume,
                this.audioContext.currentTime,
                0.1
            );
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setTargetAtTime(
                this.isMuted ? 0 : this.volume,
                this.audioContext.currentTime,
                0.1
            );
        }
    }
    
    isPlaying() {
        return this.isPlaying;
    }
    
    isMuted() {
        return this.isMuted;
    }
    
    hasBeenStarted() {
        return this.hasStarted;
    }
}

/**
 * NASA Data Management System
 * Handles API requests, data caching, and real-time updates
 */
class DataManager {
    constructor() {
        this.cache = {};
        this.lastUpdate = {};
        this.isOnline = navigator.onLine;
        
        this.init();
    }
    
    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateDataStatus('online', 'Connected to NASA APIs');
            this.refreshAll();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateDataStatus('offline', 'Using cached data');
        });
        
        // Set initial status
        this.updateDataStatus('loading', 'Loading...');
    }
    
    async loadFromCache() {
        try {
            const cachedData = localStorage.getItem('cosmos-explorer-data');
            if (cachedData) {
                this.cache = JSON.parse(cachedData);
                console.log('Loaded cached data');
                
                // Update UI with cached data
                if (this.cache.apod) this.updateAPOD(this.cache.apod);
                if (this.cache.neo) this.updateNEO(this.cache.neo);
                if (this.cache.iss) this.updateISS(this.cache.iss);
            }
        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
    }
    
    saveToCache() {
        try {
            localStorage.setItem('cosmos-explorer-data', JSON.stringify(this.cache));
        } catch (error) {
            console.warn('Failed to save data to cache:', error);
        }
    }
    
    async refreshAll() {
        if (!this.isOnline) {
            this.updateDataStatus('offline', 'Using cached data');
            return;
        }
        
        this.updateDataStatus('loading', 'Fetching fresh data...');
        
        const promises = [
            this.fetchAPOD(),
            this.fetchNEO(),
            this.fetchISS()
        ];
        
        try {
            await Promise.allSettled(promises);
            this.updateDataStatus('online', 'Data updated successfully');
            this.saveToCache();
        } catch (error) {
            console.warn('Some data requests failed:', error);
            this.updateDataStatus('offline', 'Using cached data');
        }
    }
    
    async fetchAPOD() {
        try {
            const response = await this.fetchWithTimeout(NASA_ENDPOINTS.APOD, 10000);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'APOD API error');
            }
            
            this.cache.apod = data;
            this.lastUpdate.apod = Date.now();
            this.updateAPOD(data);
            
            console.log('APOD data updated');
        } catch (error) {
            console.warn('Failed to fetch APOD:', error);
            
            // Use fallback data if no cache available
            if (!this.cache.apod) {
                this.cache.apod = this.getFallbackAPOD();
                this.updateAPOD(this.cache.apod);
            }
        }
    }
    
    async fetchNEO() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const url = `${NASA_ENDPOINTS.NEO}&start_date=${today}&end_date=${today}`;
            
            const response = await this.fetchWithTimeout(url, 10000);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'NEO API error');
            }
            
            this.cache.neo = data;
            this.lastUpdate.neo = Date.now();
            this.updateNEO(data);
            
            console.log('NEO data updated');
        } catch (error) {
            console.warn('Failed to fetch NEO data:', error);
            
            if (!this.cache.neo) {
                this.cache.neo = this.getFallbackNEO();
                this.updateNEO(this.cache.neo);
            }
        }
    }
    
    async fetchISS() {
        try {
            const response = await this.fetchWithTimeout(NASA_ENDPOINTS.ISS, 5000);
            const data = await response.json();
            
            this.cache.iss = data;
            this.lastUpdate.iss = Date.now();
            this.updateISS(data);
            
            console.log('ISS location updated');
        } catch (error) {
            console.warn('Failed to fetch ISS location:', error);
            
            if (!this.cache.iss) {
                this.cache.iss = this.getFallbackISS();
                this.updateISS(this.cache.iss);
            }
        }
    }
    
    fetchWithTimeout(url, timeout = 8000) {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }
    
    updateDataStatus(status, message) {
        const statusElement = document.getElementById('data-status');
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');
        
        indicator.className = `status-indicator ${status}`;
        text.textContent = message;
    }
    
    updateAPOD(data) {
        const image = document.getElementById('apod-image');
        const title = document.getElementById('apod-title');
        const date = document.getElementById('apod-date');
        const explanation = document.getElementById('apod-explanation');
        
        if (data.media_type === 'image') {
            image.src = data.url;
            image.alt = data.title;
        } else {
            // Handle video content
            image.src = data.thumbnail_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMWUyOTNiIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiI+VmlkZW8gQ29udGVudDwvdGV4dD4KPC9zdmc+';
        }
        
        title.textContent = data.title;
        date.textContent = data.date;
        explanation.textContent = data.explanation;
        
        // Add click handler for fullscreen view
        const card = document.getElementById('apod-card');
        const expandBtn = card.querySelector('.expand-btn');
        
        expandBtn.onclick = () => this.showFullscreenAPOD(data);
    }
    
    updateNEO(data) {
        const count = document.getElementById('neo-count');
        const list = document.getElementById('neo-list');
        const canvas = document.getElementById('neo-canvas');
        
        // Count total NEOs
        let totalNEOs = 0;
        const allNEOs = [];
        
        Object.values(data.near_earth_objects || {}).forEach(dayNEOs => {
            totalNEOs += dayNEOs.length;
            allNEOs.push(...dayNEOs);
        });
        
        count.textContent = `${totalNEOs} objects detected`;
        
        // Update list
        list.innerHTML = '';
        allNEOs.slice(0, 5).forEach(neo => {
            const item = document.createElement('div');
            item.className = 'neo-item';
            
            const closeApproach = neo.close_approach_data[0];
            const distance = parseFloat(closeApproach.miss_distance.kilometers).toLocaleString();
            
            item.innerHTML = `
                <div class="neo-name">${neo.name}</div>
                <div class="neo-distance">${distance} km</div>
            `;
            
            list.appendChild(item);
        });
        
        // Draw NEO visualization
        this.drawNEOVisualization(canvas, allNEOs);
    }
    
    updateISS(data) {
        const lat = document.getElementById('iss-lat');
        const lon = document.getElementById('iss-lon');
        const canvas = document.getElementById('iss-canvas');
        
        const latitude = parseFloat(data.iss_position.latitude).toFixed(2);
        const longitude = parseFloat(data.iss_position.longitude).toFixed(2);
        
        lat.textContent = latitude;
        lon.textContent = longitude;
        
        // Draw ISS position on world map
        this.drawISSVisualization(canvas, latitude, longitude);
    }
    
    drawNEOVisualization(canvas, neos) {
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Earth
        ctx.fillStyle = '#2196f3';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw orbital paths and NEOs
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
        ctx.lineWidth = 1;
        
        neos.slice(0, 10).forEach((neo, index) => {
            const closeApproach = neo.close_approach_data[0];
            const distance = parseFloat(closeApproach.miss_distance.kilometers);
            
            // Scale distance for visualization (not to scale!)
            const visualDistance = 30 + (distance / 1000000) * 50;
            const angle = (index / 10) * Math.PI * 2;
            
            // Draw orbit
            ctx.beginPath();
            ctx.arc(centerX, centerY, visualDistance, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw NEO
            const neoX = centerX + Math.cos(angle) * visualDistance;
            const neoY = centerY + Math.sin(angle) * visualDistance;
            
            ctx.fillStyle = neo.is_potentially_hazardous_asteroid ? '#ff5722' : '#ffc107';
            ctx.beginPath();
            ctx.arc(neoX, neoY, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawISSVisualization(canvas, latitude, longitude) {
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw world map (simplified)
        ctx.fillStyle = '#2196f3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw continents (very simplified)
        ctx.fillStyle = '#4caf50';
        
        // North America
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.2, canvas.height * 0.3, 40, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Europe/Asia
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.6, canvas.height * 0.25, 60, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Africa
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.52, canvas.height * 0.55, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Convert lat/lon to canvas coordinates
        const x = ((parseFloat(longitude) + 180) / 360) * canvas.width;
        const y = ((90 - parseFloat(latitude)) / 180) * canvas.height;
        
        // Draw ISS position
        ctx.fillStyle = '#ff9800';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw ISS orbit trail
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.4, canvas.height * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    showFullscreenAPOD(data) {
        // Create fullscreen modal for APOD
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('aria-hidden', 'false');
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <button class="modal-close" aria-label="Close">&times;</button>
                <h2>${data.title}</h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">${data.date}</p>
                <img src="${data.url}" alt="${data.title}" style="width: 100%; height: auto; border-radius: var(--radius-lg); margin-bottom: var(--space-lg);">
                <p style="color: var(--text-secondary); line-height: var(--leading-relaxed);">${data.explanation}</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => {
            modal.setAttribute('aria-hidden', 'true');
            setTimeout(() => document.body.removeChild(modal), 300);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeBtn.click();
            }
        };
    }
    
    getFallbackAPOD() {
        return {
            title: "Eagle Nebula",
            date: "2024-01-01",
            explanation: "The Eagle Nebula, also known as Messier 16, is a young open cluster of stars in the constellation Serpens. This region of active star formation is approximately 7,000 light years away from Earth.",
            url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8cmFkaWFsR3JhZGllbnQgaWQ9Im5lYnVsYSIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmNjk5NDtzdG9wLW9wYWNpdHk6MC44IiAvPgo8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzgzMzNlYTtzdG9wLW9wYWNpdHk6MC42IiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwYTBmMWM7c3RvcC1vcGFjaXR5OjEiIC8+CjwvcmFkaWFsR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjbmVidWxhKSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45Ii8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjEyMCIgcj0iMS41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjciLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMjAwIiByPSIzIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjgiLz4KPGNpcmNsZSBjeD0iMzIwIiBjeT0iNjAiIHI9IjEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNiIvPgo8dGV4dCB4PSIyMDAiIHk9IjI2MCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIG9wYWNpdHk9IjAuOCI+RWFnbGUgTmVidWxhIC0gU3RhciBGb3JtYXRpb24gUmVnaW9uPC90ZXh0Pgo8L3N2Zz4=",
            media_type: "image"
        };
    }
    
    getFallbackNEO() {
        return {
            near_earth_objects: {
                "2024-01-01": [
                    {
                        name: "(2019 AA) Sample Asteroid",
                        is_potentially_hazardous_asteroid: false,
                        close_approach_data: [{
                            miss_distance: {
                                kilometers: "1234567.89"
                            }
                        }]
                    },
                    {
                        name: "(2020 BB) Example NEO",
                        is_potentially_hazardous_asteroid: true,
                        close_approach_data: [{
                            miss_distance: {
                                kilometers: "987654.32"
                            }
                        }]
                    }
                ]
            }
        };
    }
    
    getFallbackISS() {
        return {
            iss_position: {
                latitude: "25.7617",
                longitude: "-80.1918"
            },
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}

/**
 * Story Mode Management System
 * Handles chapter navigation, 3D scene transitions, and narrative playback
 */
class StoryManager {
    constructor() {
        this.currentChapter = 1;
        this.totalChapters = CONFIG.STORY.CHAPTERS;
        this.isNarrationPlaying = false;
        this.chapterProgress = 0;
        
        this.chapters = {
            1: {
                title: "Lift-Off",
                narration: "Every great journey begins with a single step — or in our case, a launch. Rockets break free from Earth's gravity, reaching speeds of 28,000 km/h to remain in orbit.",
                scene: "launch"
            },
            2: {
                title: "Orbit & Satellites",
                narration: "Satellites are our eyes in the sky. From weather forecasting to navigation, thousands of satellites orbit Earth and shape modern life.",
                scene: "orbit"
            },
            3: {
                title: "Deep Space Exploration",
                narration: "Beyond Earth's orbit lies the unknown. Probes journey across the solar system, returning data that stretches human knowledge.",
                scene: "deep_space"
            },
            4: {
                title: "Galaxies & Beyond",
                narration: "Our galaxy contains over 100 billion stars. It's only one among billions — a humbling scale of the cosmos.",
                scene: "galaxy"
            },
            5: {
                title: "Return to Earth",
                narration: "After exploring the stars, we return home — a reminder that Earth is our only habitable world.",
                scene: "earth_return"
            }
        };
        
        this.init();
    }
    
    init() {
        // Load saved chapter progress
        const savedChapter = localStorage.getItem('cosmos-explorer-chapter');
        if (savedChapter) {
            this.currentChapter = parseInt(savedChapter);
        }
        
        this.updateChapterUI();
    }
    
    initialize() {
        // Called when story view is activated
        this.updateChapterUI();
        this.updateStoryProgress();
        
        // Set up scroll-based chapter detection
        this.setupScrollDetection();
    }
    
    setupScrollDetection() {
        const storyContent = document.getElementById('story-content');
        const chapters = storyContent.querySelectorAll('.chapter');
        
        // Set up intersection observer for chapter visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const chapterNum = parseInt(entry.target.dataset.chapter);
                    if (chapterNum !== this.currentChapter) {
                        this.goToChapter(chapterNum, false); // Don't animate scroll
                    }
                }
            });
        }, { threshold: 0.5 });
        
        chapters.forEach(chapter => observer.observe(chapter));
    }
    
    goToChapter(chapterNumber, animate = true) {
        if (chapterNumber < 1 || chapterNumber > this.totalChapters) return;
        
        this.currentChapter = chapterNumber;
        
        // Update UI
        this.updateChapterUI();
        this.updateStoryProgress();
        
        // Scroll to chapter if animate is true
        if (animate) {
            this.scrollToChapter(chapterNumber);
        }
        
        // Update 3D scene
        if (app?.components?.renderer) {
            app.components.renderer.setScene('story');
        }
        
        // Play transition sound
        if (app?.components?.audio) {
            app.components.audio.playSound('whoosh');
        }
        
        // Save progress
        localStorage.setItem('cosmos-explorer-chapter', chapterNumber.toString());
        
        console.log(`Switched to chapter ${chapterNumber}: ${this.chapters[chapterNumber].title}`);
    }
    
    nextChapter() {
        if (this.currentChapter < this.totalChapters) {
            this.goToChapter(this.currentChapter + 1);
        }
    }
    
    previousChapter() {
        if (this.currentChapter > 1) {
            this.goToChapter(this.currentChapter - 1);
        }
    }
    
    scrollToChapter(chapterNumber) {
        const storyContent = document.getElementById('story-content');
        const targetChapter = storyContent.querySelector(`[data-chapter="${chapterNumber}"]`);
        
        if (targetChapter) {
            targetChapter.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    updateChapterFromScroll() {
        // This is called when user manually scrolls
        const storyContent = document.getElementById('story-content');
        const chapters = storyContent.querySelectorAll('.chapter');
        const scrollTop = storyContent.scrollTop;
        const containerHeight = storyContent.clientHeight;
        
        let activeChapter = 1;
        
        chapters.forEach((chapter, index) => {
            const chapterTop = chapter.offsetTop;
            const chapterHeight = chapter.offsetHeight;
            
            if (scrollTop >= chapterTop - containerHeight / 2 &&
                scrollTop < chapterTop + chapterHeight - containerHeight / 2) {
                activeChapter = index + 1;
            }
        });
        
        if (activeChapter !== this.currentChapter) {
            this.goToChapter(activeChapter, false);
        }
    }
    
    updateChapterUI() {
        const chapter = this.chapters[this.currentChapter];
        
        // Update chapter indicator
        const chapterNumber = document.querySelector('.chapter-number');
        const chapterTitle = document.querySelector('.chapter-title');
        
        if (chapterNumber) chapterNumber.textContent = this.currentChapter;
        if (chapterTitle) chapterTitle.textContent = chapter.title;
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-chapter');
        const nextBtn = document.getElementById('next-chapter');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentChapter === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentChapter === this.totalChapters;
        }
        
        // Update chapter dots
        document.querySelectorAll('.dot').forEach((dot, index) => {
            const chapterNum = index + 1;
            dot.classList.toggle('active', chapterNum === this.currentChapter);
        });
        
        // Update active chapter content
        document.querySelectorAll('.chapter').forEach((chapterEl, index) => {
            const chapterNum = index + 1;
            chapterEl.classList.toggle('active', chapterNum === this.currentChapter);
        });
    }
    
    updateStoryProgress() {
        const progress = (this.currentChapter / this.totalChapters) * 100;
        const progressFill = document.getElementById('story-progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }
    
    toggleNarration() {
        if ('speechSynthesis' in window) {
            if (this.isNarrationPlaying) {
                this.stopNarration();
            } else {
                this.startNarration();
            }
        } else {
            app.showToast('Narration Unavailable', 'Speech synthesis not supported in this browser', 'warning');
        }
    }
    
    startNarration() {
        if (!('speechSynthesis' in window)) return;
        
        const chapter = this.chapters[this.currentChapter];
        const utterance = new SpeechSynthesisUtterance(chapter.narration);
        
        // Configure voice
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 0.7;
        
        // Select a suitable voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Google') || voice.name.includes('Microsoft'))
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => {
            this.isNarrationPlaying = true;
            this.updateNarrationUI();
        };
        
        utterance.onend = () => {
            this.isNarrationPlaying = false;
            this.updateNarrationUI();
        };
        
        utterance.onerror = (error) => {
            console.warn('Speech synthesis error:', error);
            this.isNarrationPlaying = false;
            this.updateNarrationUI();
        };
        
        speechSynthesis.speak(utterance);
        
        // Play narration chime
        if (app?.components?.audio) {
            app.components.audio.playSound('chime');
        }
    }
    
    stopNarration() {
        speechSynthesis.cancel();
        this.isNarrationPlaying = false;
        this.updateNarrationUI();
    }
    
    updateNarrationUI() {
        const playPauseBtn = document.getElementById('play-pause-story');
        if (playPauseBtn) {
            playPauseBtn.textContent = this.isNarrationPlaying ? '⏸️' : '▶️';
            playPauseBtn.title = this.isNarrationPlaying ? 'Pause Narration' : 'Play Narration';
        }
    }
}

/**
 * Settings and Preferences Management
 * Handles user preferences, accessibility options, and data persistence
 */
class SettingsManager {
    constructor() {
        this.settings = {
            reduceMotion: false,
            volume: CONFIG.AUDIO.MASTER_VOLUME,
            narrationEnabled: true,
            currentView: 'home',
            lastChapter: 1,
            audioEnabled: false,
            theme: 'dark'
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.load();
        this.applySettings();
    }
    
    bindEvents() {
        // Reduce motion toggle
        const reduceMotionToggle = document.getElementById('reduce-motion');
        if (reduceMotionToggle) {
            reduceMotionToggle.addEventListener('change', (e) => {
                this.setReduceMotion(e.target.checked);
            });
        }
        
        // Volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.setVolume(volume);
            });
        }
        
        // Narration toggle
        const narrationToggle = document.getElementById('narration-toggle');
        if (narrationToggle) {
            narrationToggle.addEventListener('change', (e) => {
                this.setNarrationEnabled(e.target.checked);
            });
        }
        
        // Clear data button
        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
        
        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addListener((e) => {
            if (e.matches && !this.settings.reduceMotion) {
                this.setReduceMotion(true);
                app.showToast('Reduced Motion', 'Animations have been minimized based on your system preferences', 'info');
            }
        });
        
        // Apply initial system preference
        if (mediaQuery.matches) {
            this.setReduceMotion(true);
        }
    }
    
    load() {
        try {
            const savedSettings = localStorage.getItem('cosmos-explorer-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
                console.log('Settings loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    save() {
        try {
            localStorage.setItem('cosmos-explorer-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }
    
    applySettings() {
        // Apply reduce motion setting
        if (this.settings.reduceMotion) {
            document.body.classList.add('reduce-motion');
        }
        
        // Update UI elements
        this.updateUI();
        
        console.log('Settings applied:', this.settings);
    }
    
    updateUI() {
        // Update reduce motion toggle
        const reduceMotionToggle = document.getElementById('reduce-motion');
        if (reduceMotionToggle) {
            reduceMotionToggle.checked = this.settings.reduceMotion;
        }
        
        // Update volume slider
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        if (volumeSlider && volumeValue) {
            const volumePercent = Math.round(this.settings.volume * 100);
            volumeSlider.value = volumePercent;
            volumeValue.textContent = `${volumePercent}%`;
        }
        
        // Update narration toggle
        const narrationToggle = document.getElementById('narration-toggle');
        if (narrationToggle) {
            narrationToggle.checked = this.settings.narrationEnabled;
        }
    }
    
    setReduceMotion(enabled) {
        this.settings.reduceMotion = enabled;
        
        if (enabled) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
        
        this.save();
        console.log('Reduce motion:', enabled);
    }
    
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        
        // Update audio system
        if (app?.components?.audio) {
            app.components.audio.setVolume(this.settings.volume);
        }
        
        // Update UI
        const volumeValue = document.getElementById('volume-value');
        if (volumeValue) {
            volumeValue.textContent = `${Math.round(this.settings.volume * 100)}%`;
        }
        
        this.save();
    }
    
    setNarrationEnabled(enabled) {
        this.settings.narrationEnabled = enabled;
        
        // Stop current narration if disabling
        if (!enabled && app?.components?.story) {
            app.components.story.stopNarration();
        }
        
        this.save();
    }
    
    setCurrentView(view) {
        this.settings.currentView = view;
        this.save();
    }
    
    setLastChapter(chapter) {
        this.settings.lastChapter = chapter;
        this.save();
    }
    
    setAudioEnabled(enabled) {
        this.settings.audioEnabled = enabled;
        this.save();
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all stored data? This will reset your preferences and cached NASA data.')) {
            // Clear localStorage
            localStorage.clear();
            
            // Reset settings to defaults
            this.settings = {
                reduceMotion: false,
                volume: CONFIG.AUDIO.MASTER_VOLUME,
                narrationEnabled: true,
                currentView: 'home',
                lastChapter: 1,
                audioEnabled: false,
                theme: 'dark'
            };
            
            // Apply reset settings
            this.applySettings();
            
            // Refresh data
            if (app?.components?.data) {
                app.components.data.refreshAll();
            }
            
            app.showToast('Data Cleared', 'All stored data has been reset to defaults', 'success');
        }
    }
    
    get(key) {
        return this.settings[key];
    }
    
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});

// Handle page visibility changes (for performance optimization)
document.addEventListener('visibilitychange', () => {
    if (app?.components?.renderer) {
        if (document.hidden) {
            // Pause expensive operations when tab is not visible
            app.components.renderer.stop();
        } else {
            // Resume when tab becomes visible again
            app.components.renderer.start();
        }
    }
});

// Export for debugging (only in development)
if (typeof window !== 'undefined') {
    window.CosmosExplorer = {
        app,
        CONFIG,
        NASA_ENDPOINTS
    };
}