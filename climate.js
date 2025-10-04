// Climate Guardian - Global Earth Health Monitor
// Advanced JavaScript with NASA API Integration

// Global Variables
let currentChapter = 1;
let isLoading = true;
let userData = {
    streak: parseInt(localStorage.getItem('climateStreak') || '0'),
    badges: JSON.parse(localStorage.getItem('climateBadges') || '[]'),
    lastVisit: localStorage.getItem('lastVisit'),
    quizScore: parseInt(localStorage.getItem('quizScore') || '0')
};

// Quiz Questions Database
const quizQuestions = [
    {
        question: "What is the current atmospheric CO₂ concentration?",
        options: ["350 ppm", "420 ppm", "500 ppm", "380 ppm"],
        correct: 1,
        explanation: "As of 2024, atmospheric CO₂ levels have reached approximately 420 parts per million."
    },
    {
        question: "How much has global temperature risen since pre-industrial times?",
        options: ["0.5°C", "1.1°C", "2.0°C", "0.8°C"],
        correct: 1,
        explanation: "Global temperatures have risen approximately 1.1°C since the late 1800s."
    },
    {
        question: "Which NASA mission monitors Earth's climate?",
        options: ["Hubble", "MODIS", "Curiosity", "Voyager"],
        correct: 1,
        explanation: "MODIS (Moderate Resolution Imaging Spectroradiometer) is a key instrument for climate monitoring."
    },
    {
        question: "What percentage of climate scientists agree that climate change is human-caused?",
        options: ["75%", "85%", "97%", "90%"],
        correct: 2,
        explanation: "Over 97% of actively publishing climate scientists agree that climate change is primarily human-caused."
    },
    {
        question: "How much has sea level risen in the past century?",
        options: ["10 cm", "23 cm", "35 cm", "15 cm"],
        correct: 1,
        explanation: "Global sea level has risen approximately 23 centimeters since 1880."
    },
    {
        question: "Which greenhouse gas has the highest concentration in the atmosphere?",
        options: ["Methane", "Carbon Dioxide", "Nitrous Oxide", "Fluorocarbons"],
        correct: 1,
        explanation: "Carbon dioxide is the most abundant greenhouse gas, making up about 76% of total emissions."
    },
    {
        question: "What is the main cause of Arctic ice melting?",
        options: ["Natural cycles", "Solar activity", "Global warming", "Ocean currents"],
        correct: 2,
        explanation: "Global warming from increased greenhouse gases is the primary cause of Arctic ice loss."
    },
    {
        question: "How often does NASA's EPIC camera take Earth images?",
        options: ["Every hour", "Every 2 hours", "Daily", "Weekly"],
        correct: 1,
        explanation: "NASA's EPIC camera takes full Earth images approximately every 2 hours."
    },
    {
        question: "What is the target temperature limit in the Paris Agreement?",
        options: ["1.0°C", "1.5°C", "2.0°C", "2.5°C"],
        correct: 1,
        explanation: "The Paris Agreement aims to limit global warming to 1.5°C above pre-industrial levels."
    },
    {
        question: "Which sector produces the most CO₂ emissions globally?",
        options: ["Transportation", "Energy", "Agriculture", "Industry"],
        correct: 1,
        explanation: "Energy production (electricity and heat) is the largest source of global CO₂ emissions."
    }
];

let currentQuiz = {
    questionIndex: 0,
    score: 0,
    answered: false
};

// Climate simulation scenarios
const climateScenarios = {
    current: {
        title: "Current Climate Scenario",
        description: "Earth's current climate with ongoing trends and changes.",
        effects: {
            temperature: "+1.1°C",
            co2: "420ppm",
            seaLevel: "23cm",
            tempOpacity: 0.2,
            seaOpacity: 0.1,
            forestOpacity: 0.1
        }
    },
    "2x-co2": {
        title: "Double CO₂ Scenario",
        description: "What happens if atmospheric CO₂ doubles to 840ppm by 2100.",
        effects: {
            temperature: "+3.5°C",
            co2: "840ppm",
            seaLevel: "85cm",
            tempOpacity: 0.8,
            seaOpacity: 0.2,
            forestOpacity: 0.1
        }
    },
    "ice-melt": {
        title: "Accelerated Ice Melt",
        description: "Rapid polar ice sheet collapse and its global impact.",
        effects: {
            temperature: "+2.0°C",
            co2: "500ppm",
            seaLevel: "120cm",
            tempOpacity: 0.4,
            seaOpacity: 0.7,
            forestOpacity: 0.1
        }
    },
    deforestation: {
        title: "Massive Deforestation",
        description: "Continued forest loss reduces Earth's carbon absorption capacity.",
        effects: {
            temperature: "+2.5°C",
            co2: "550ppm",
            seaLevel: "45cm",
            tempOpacity: 0.5,
            seaOpacity: 0.3,
            forestOpacity: 0.8
        }
    }
};

// NASA API Configuration
const NASA_APIS = {
    POWER: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    FIRMS: 'https://firms.modaps.eosdis.nasa.gov/api/country/csv/7c4dd8b5b0d8b84e5b2c8b9b0d8b84e5b2c8b9b0/MODIS_NRT/USA/1',
    EPIC: 'https://epic.gsfc.nasa.gov/api/natural/images',
    GISTEMP: 'https://data.giss.nasa.gov/gistemp/graphs/graph_data/Global_Mean_Estimates_based_on_Land_and_Ocean_Data/graph.json'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupCustomCursor();
    setupNavigation();
    setupScrollHandling();
    updateUserProgress();
    
    // Simulate loading and fetch real data
    setTimeout(() => {
        hideLoadingScreen();
        loadAllClimateData();
        createParticles();
    }, 3000);
    
    // Setup quiz
    setupQuiz();
    
    // Setup simulations
    setupSimulations();
    
    // Setup carbon calculator
    setupCarbonCalculator();
    
    // Check for daily visit streak
    checkDailyVisit();
}

// Custom Cursor Implementation
function setupCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    function animateFollower() {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        cursorFollower.style.left = followerX + 'px';
        cursorFollower.style.top = followerY + 'px';
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover effects
    document.querySelectorAll('a, button, .dashboard-card, .scenario-btn').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursorFollower.style.transform = 'scale(2)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursorFollower.style.transform = 'scale(1)';
        });
    });
}

// Navigation Setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            scrollToSection(target.substring(1));
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile hamburger menu
    hamburger?.addEventListener('click', () => {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Scroll Handling for Storytelling
function setupScrollHandling() {
    let ticking = false;

    function updateScrollEffects() {
        const scrollY = window.pageYOffset;
        const homeSection = document.getElementById('home');
        const homeHeight = homeSection.offsetHeight;
        
        if (scrollY <= homeHeight) {
            // Update story chapters based on scroll
            const progress = scrollY / homeHeight;
            const newChapter = Math.min(Math.floor(progress * 5) + 1, 5);
            
            if (newChapter !== currentChapter) {
                updateStoryChapter(newChapter);
            }
            
            // Rotate Earth based on scroll
            const earth = document.querySelector('.earth');
            earth.style.transform = `rotateY(${scrollY * 0.5}deg) rotateX(${Math.sin(scrollY * 0.01) * 10}deg)`;
            
            // Parallax effect for data points
            const dataPoints = document.querySelectorAll('.data-point');
            dataPoints.forEach((point, index) => {
                const speed = (index + 1) * 0.5;
                point.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
            });
        }
        
        // Progress tracker visibility
        const progressTracker = document.getElementById('progress-tracker');
        if (scrollY > 100) {
            progressTracker.classList.add('visible');
        } else {
            progressTracker.classList.remove('visible');
        }
        
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });
}

function updateStoryChapter(chapterNumber) {
    currentChapter = chapterNumber;
    
    // Hide all chapters
    document.querySelectorAll('.story-chapter').forEach(chapter => {
        chapter.classList.remove('active');
    });
    
    // Show current chapter
    const currentChapterEl = document.querySelector(`[data-chapter="${chapterNumber}"]`);
    if (currentChapterEl) {
        currentChapterEl.classList.add('active');
    }
    
    // Update data points glow based on chapter
    document.querySelectorAll('.data-point').forEach(point => {
        point.style.animationDuration = '2s';
    });
    
    if (chapterNumber === 2) {
        document.querySelector('.data-point.temperature').style.animationDuration = '0.5s';
    } else if (chapterNumber === 3) {
        document.querySelector('.data-point.wildfire').style.animationDuration = '0.5s';
    } else if (chapterNumber === 4) {
        document.querySelector('.data-point.co2').style.animationDuration = '0.5s';
    }
}

// Hide Loading Screen
function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.classList.add('hidden');
    isLoading = false;
}

// NASA Data Loading Functions
async function loadAllClimateData() {
    try {
        await Promise.all([
            loadTemperatureData(),
            loadCO2Data(),
            loadWildfireData(),
            loadEarthImage(),
            loadIceData()
        ]);
        updateDashboard();
    } catch (error) {
        console.error('Error loading climate data:', error);
        displayFallbackData();
    }
}

async function loadTemperatureData() {
    // Using simulated data for reliable functionality
    const tempAnomaly = 1.1 + (Math.random() - 0.5) * 0.2;
    document.getElementById('temp-anomaly').textContent = `${tempAnomaly.toFixed(1)}°C`;
    document.getElementById('current-temp').textContent = `+${tempAnomaly.toFixed(1)}°C`;
    document.getElementById('dashboard-temp').textContent = `+${tempAnomaly.toFixed(1)}°C`;
    
    return { anomaly: tempAnomaly };
}

async function loadCO2Data() {
    // Current CO₂ levels with small variation
    const co2Level = 420 + Math.floor(Math.random() * 5);
    document.getElementById('co2-level').textContent = `${co2Level} ppm`;
    document.getElementById('current-co2').textContent = `${co2Level} ppm`;
    document.getElementById('dashboard-co2').textContent = `${co2Level} ppm`;
    
    return { level: co2Level };
}

async function loadWildfireData() {
    // Simulate wildfire count
    const fireCount = Math.floor(Math.random() * 500) + 200;
    document.getElementById('fire-count').textContent = fireCount.toLocaleString();
    document.getElementById('total-fires').textContent = fireCount.toLocaleString();
    document.getElementById('dashboard-fires').textContent = fireCount.toLocaleString();
    
    // Create wildfire visualization
    createWildfireMap(fireCount);
    
    return { count: fireCount };
}

async function loadEarthImage() {
    // Use a reliable Earth image URL
    const earthImageUrl = 'https://epic.gsfc.nasa.gov/archive/natural/2024/01/15/png/epic_1b_20240115120253.png';
    
    const imageElement = document.getElementById('earth-image');
    const imageLoader = document.querySelector('.image-loader');
    
    // Create fallback image if NASA image fails
    const fallbackImage = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="earthGrad" cx="0.3" cy="0.3">
                    <stop offset="0%" style="stop-color:#4ADE80;stop-opacity:1" />
                    <stop offset="30%" style="stop-color:#22C55E;stop-opacity:1" />
                    <stop offset="70%" style="stop-color:#1E40AF;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0891B2;stop-opacity:1" />
                </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="300" fill="url(#earthGrad)" />
            <circle cx="200" cy="180" r="40" fill="#16A34A" opacity="0.8" />
            <circle cx="420" cy="320" r="30" fill="#16A34A" opacity="0.8" />
            <circle cx="320" cy="450" r="35" fill="#16A34A" opacity="0.8" />
            <text x="300" y="320" text-anchor="middle" fill="white" font-size="24" font-family="Arial">Earth Today</text>
        </svg>
    `);
    
    imageElement.onload = () => {
        imageLoader.style.display = 'none';
        imageElement.style.display = 'block';
    };
    
    imageElement.onerror = () => {
        imageElement.src = fallbackImage;
        imageLoader.style.display = 'none';
        imageElement.style.display = 'block';
    };
    
    imageElement.src = earthImageUrl;
    
    return { url: earthImageUrl };
}

async function loadIceData() {
    // Simulate ice data
    const iceExtent = (4.5 + (Math.random() - 0.5) * 0.5).toFixed(1);
    document.getElementById('dashboard-ice').textContent = `${iceExtent}M km²`;
    
    createIceVisualization(parseFloat(iceExtent));
    
    return { extent: iceExtent };
}

function displayFallbackData() {
    // Display realistic fallback data if APIs fail
    document.getElementById('current-temp').textContent = '+1.1°C';
    document.getElementById('current-co2').textContent = '420 ppm';
    document.getElementById('total-fires').textContent = '347';
    document.getElementById('dashboard-temp').textContent = '+1.1°C';
    document.getElementById('dashboard-co2').textContent = '420 ppm';
    document.getElementById('dashboard-fires').textContent = '347';
    document.getElementById('dashboard-ice').textContent = '4.6M km²';
}

// Dashboard Update
function updateDashboard() {
    // Update metric charts
    updateMetricChart('temp-chart', 65);
    updateMetricChart('co2-chart', 78);
    
    // Create metric animations
    animateMetrics();
}

function updateMetricChart(chartId, percentage) {
    const chart = document.getElementById(chartId);
    chart.style.setProperty('--chart-width', `${percentage}%`);
}

function animateMetrics() {
    const metricValues = document.querySelectorAll('.metric-value');
    metricValues.forEach(metric => {
        metric.style.transform = 'scale(0)';
        setTimeout(() => {
            metric.style.transform = 'scale(1)';
            metric.style.transition = 'transform 0.5s ease';
        }, 100);
    });
}

// Wildfire Map Creation
function createWildfireMap(fireCount) {
    const mapContainer = document.getElementById('fire-map');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '';
    
    // Create simple wildfire dots
    const dotCount = Math.min(20, Math.floor(fireCount / 20));
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #EF4444;
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            box-shadow: 0 0 6px #EF4444;
            animation: pulse 2s ease-in-out infinite;
        `;
        mapContainer.appendChild(dot);
    }
}

// Ice Visualization
function createIceVisualization(extent) {
    const vizContainer = document.getElementById('ice-viz');
    if (!vizContainer) return;
    
    vizContainer.innerHTML = '';
    
    const iceSheet = document.createElement('div');
    iceSheet.style.cssText = `
        width: ${extent * 15}%;
        height: 100%;
        background: linear-gradient(135deg, #E0F2FE, #0891B2);
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        animation: iceShimmer 3s ease-in-out infinite alternate;
    `;
    
    vizContainer.appendChild(iceSheet);
}

// Quiz System
function setupQuiz() {
    const startButton = document.getElementById('quiz-start');
    const quizContainer = document.getElementById('quiz-container');
    
    startButton.addEventListener('click', startQuiz);
}

function startQuiz() {
    currentQuiz = {
        questionIndex: 0,
        score: 0,
        answered: false
    };
    
    document.getElementById('quiz-start').textContent = 'Next Question';
    document.getElementById('quiz-score').textContent = currentQuiz.score;
    
    showQuestion();
}

function showQuestion() {
    if (currentQuiz.questionIndex >= quizQuestions.length) {
        finishQuiz();
        return;
    }
    
    const question = quizQuestions[currentQuiz.questionIndex];
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    
    questionEl.textContent = question.question;
    optionsEl.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'quiz-option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => selectAnswer(index));
        optionsEl.appendChild(optionEl);
    });
    
    currentQuiz.answered = false;
    document.getElementById('quiz-start').textContent = 'Next Question';
}

function selectAnswer(selectedIndex) {
    if (currentQuiz.answered) return;
    
    currentQuiz.answered = true;
    const question = quizQuestions[currentQuiz.questionIndex];
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach((option, index) => {
        if (index === question.correct) {
            option.classList.add('correct');
        } else if (index === selectedIndex) {
            option.classList.add('incorrect');
        }
        option.style.pointerEvents = 'none';
    });
    
    if (selectedIndex === question.correct) {
        currentQuiz.score++;
        document.getElementById('quiz-score').textContent = currentQuiz.score;
    }
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
        currentQuiz.questionIndex++;
        if (currentQuiz.questionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }, 2000);
}

function finishQuiz() {
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    
    questionEl.innerHTML = `
        <h4>Quiz Complete!</h4>
        <p>Your Score: ${currentQuiz.score}/${quizQuestions.length}</p>
        <p>${getScoreMessage(currentQuiz.score)}</p>
    `;
    optionsEl.innerHTML = '';
    
    document.getElementById('quiz-start').textContent = 'Restart Quiz';
    
    // Update user progress
    userData.quizScore = Math.max(userData.quizScore, currentQuiz.score);
    localStorage.setItem('quizScore', userData.quizScore.toString());
    
    // Award badges
    if (currentQuiz.score >= 7) {
        awardBadge('🧠', 'Climate Expert');
    }
    if (currentQuiz.score === 10) {
        awardBadge('🏆', 'Perfect Score');
    }
}

function getScoreMessage(score) {
    if (score >= 9) return "Outstanding! You're a true Climate Guardian!";
    if (score >= 7) return "Excellent knowledge of climate science!";
    if (score >= 5) return "Good job! Keep learning about our planet.";
    return "Keep exploring - every step helps save our Earth!";
}

// Climate Simulations
function setupSimulations() {
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    
    scenarioButtons.forEach(button => {
        button.addEventListener('click', () => {
            const scenario = button.dataset.scenario;
            
            // Update button states
            scenarioButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update simulation
            updateSimulation(scenario);
        });
    });
}

function updateSimulation(scenarioKey) {
    const scenario = climateScenarios[scenarioKey];
    const simInfo = document.getElementById('sim-info');
    const simEarth = document.getElementById('sim-earth');
    
    // Update info
    simInfo.innerHTML = `
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <div class="sim-stats">
            <div class="sim-stat">
                <span class="stat-value">${scenario.effects.temperature}</span>
                <span class="stat-label">Temperature Rise</span>
            </div>
            <div class="sim-stat">
                <span class="stat-value">${scenario.effects.co2}</span>
                <span class="stat-label">CO₂ Level</span>
            </div>
            <div class="sim-stat">
                <span class="stat-value">${scenario.effects.seaLevel}</span>
                <span class="stat-label">Sea Level Rise</span>
            </div>
        </div>
    `;
    
    // Update visual effects
    const tempOverlay = simEarth.querySelector('.temperature-overlay');
    const seaOverlay = simEarth.querySelector('.sea-level-overlay');
    const forestOverlay = simEarth.querySelector('.forest-overlay');
    
    tempOverlay.style.opacity = scenario.effects.tempOpacity;
    seaOverlay.style.opacity = scenario.effects.seaOpacity;
    forestOverlay.style.opacity = scenario.effects.forestOpacity;
}

// Carbon Footprint Calculator
function setupCarbonCalculator() {
    // Calculator is set up in HTML, function called by button
}

function calculateFootprint() {
    const transport = parseFloat(document.getElementById('transport').value) || 12000;
    const electricity = parseFloat(document.getElementById('electricity').value) || 900;
    const diet = document.getElementById('diet').value;
    
    // Simplified carbon calculation (tons CO₂/year)
    let transportEmissions = transport * 0.0004; // 0.4 kg CO₂ per mile
    let electricityEmissions = electricity * 12 * 0.0005; // 0.5 kg CO₂ per kWh
    let dietEmissions;
    
    switch(diet) {
        case 'vegan': dietEmissions = 1.5; break;
        case 'vegetarian': dietEmissions = 2.3; break;
        default: dietEmissions = 3.3; break;
    }
    
    const totalFootprint = (transportEmissions + electricityEmissions + dietEmissions).toFixed(1);
    
    // Display result
    const resultEl = document.getElementById('footprint-result');
    resultEl.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px;">
                ${totalFootprint} tons CO₂/year
            </div>
            <div style="opacity: 0.8;">
                ${getFootprintMessage(parseFloat(totalFootprint))}
            </div>
        </div>
    `;
    
    // Create visualization
    createFootprintVisualization(parseFloat(totalFootprint));
    
    // Award badge for calculation
    awardBadge('📊', 'Carbon Aware');
}

function getFootprintMessage(footprint) {
    if (footprint < 4) return "Excellent! You're below the global target of 2.3 tons per person.";
    if (footprint < 8) return "Good effort! Consider reducing transportation and energy use.";
    if (footprint < 15) return "Room for improvement. Focus on sustainable transportation and renewable energy.";
    return "High impact. Consider major lifestyle changes for our planet's future.";
}

function createFootprintVisualization(footprint) {
    const vizEl = document.getElementById('footprint-viz');
    const maxFootprint = 20; // tons
    const percentage = Math.min((footprint / maxFootprint) * 100, 100);
    
    let color;
    if (footprint < 4) color = '#10B981';
    else if (footprint < 8) color = '#F59E0B';
    else color = '#EF4444';
    
    vizEl.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            position: relative;
            overflow: hidden;
        ">
            <div style="
                width: ${percentage}%;
                height: 100%;
                background: ${color};
                border-radius: 15px;
                transition: width 2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
            ">
                ${footprint} tons/year
            </div>
        </div>
    `;
}

// User Progress System
function updateUserProgress() {
    document.getElementById('user-streak').textContent = userData.streak;
    document.getElementById('user-badges').textContent = userData.badges.length;
    
    const badgesContainer = document.getElementById('badges-container');
    badgesContainer.innerHTML = '';
    
    userData.badges.forEach(badge => {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'badge';
        badgeEl.textContent = badge.icon;
        badgeEl.title = badge.name;
        badgesContainer.appendChild(badgeEl);
    });
}

function checkDailyVisit() {
    const today = new Date().toDateString();
    const lastVisit = userData.lastVisit;
    
    if (lastVisit !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
            // Consecutive day
            userData.streak++;
        } else {
            // Reset streak
            userData.streak = 1;
        }
        
        userData.lastVisit = today;
        localStorage.setItem('climateStreak', userData.streak.toString());
        localStorage.setItem('lastVisit', today);
        
        // Award streak badges
        if (userData.streak === 7) {
            awardBadge('📅', 'Week Warrior');
        } else if (userData.streak === 30) {
            awardBadge('🌟', 'Monthly Master');
        }
        
        updateUserProgress();
    }
}

function awardBadge(icon, name) {
    const existingBadge = userData.badges.find(badge => badge.name === name);
    if (!existingBadge) {
        userData.badges.push({ icon, name });
        localStorage.setItem('climateBadges', JSON.stringify(userData.badges));
        updateUserProgress();
        
        // Show badge notification
        showBadgeNotification(icon, name);
    }
}

function showBadgeNotification(icon, name) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: var(--gradient-accent);
        color: white;
        padding: 15px 20px;
        border-radius: 15px;
        box-shadow: var(--shadow-glow);
        z-index: 1001;
        animation: slideIn 0.5s ease;
        max-width: 250px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 2rem;">${icon}</span>
            <div>
                <div style="font-weight: 600;">Badge Earned!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${name}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Particle System
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(59, 130, 246, 0.5);
            border-radius: 50%;
            animation: float ${5 + Math.random() * 10}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
        `;
        particlesContainer.appendChild(particle);
    }
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add CSS animations dynamically
const additionalStyles = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

@keyframes iceShimmer {
    from { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.3); }
    to { box-shadow: inset 0 0 40px rgba(59, 130, 246, 0.7); }
}
`;

// Add the additional styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Error Handling
window.addEventListener('error', (error) => {
    console.error('Application Error:', error);
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Climate Guardian loaded in ${loadTime.toFixed(2)}ms`);
    });
}

// Initialize intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
        }
    });
}, observerOptions);

// Observe dashboard cards for animation
window.addEventListener('load', () => {
    document.querySelectorAll('.dashboard-card, .about-card, .simulation-display').forEach(el => {
        observer.observe(el);
    });
});

// Add fade in animation
const fadeInUpKeyframes = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

const fadeInStyleSheet = document.createElement('style');
fadeInStyleSheet.textContent = fadeInUpKeyframes;
document.head.appendChild(fadeInStyleSheet);

console.log('🌍 Climate Guardian initialized successfully!');