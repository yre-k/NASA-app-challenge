// Global Application State
const AppState = {
    currentUser: null,
    currentPage: 'home',
    currentCourse: null,
    currentLesson: 0,
    courses: {},
    userProgress: {
        completedLessons: {},
        streak: 0,
        level: 1,
        xp: 0,
        lastLoginDate: null,
        badges: []
    }
};





// Starfield Background
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let numStars = 180;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

for (let i = 0; i < numStars; i++) {
  stars.push({
    x: random(0, canvas.width),
    y: random(0, canvas.height),
    radius: random(0.5, 1.5),
    speed: random(0.05, 0.2)
  });
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = random(0, canvas.width);
    }
  });
  requestAnimationFrame(animateStars);
}

animateStars();

// Sounds
const bgMusic = document.getElementById("bg-music");
const rocketSound = document.getElementById("rocket-sound");

// Play sounds after user interaction (for browsers like Chrome)
document.body.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.volume = 0.3;
    bgMusic.play();
  }
  if (rocketSound.paused) {
    rocketSound.volume = 0.6;
    rocketSound.play();
  }
}, { once: true });

// Loading Progress & Transition
setTimeout(() => {
  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("main-content").style.display = "block";
  bgMusic.pause(); // Stop music after loading, or keep it if you prefer
}, 5500);







// Course Data Structure
const CoursesData = {
    aerospace: {
        title: "Aerospace Engineering",
        icon: "🚀",
        description: "Master the principles of flight, propulsion, and spacecraft design",
        difficulty: "Advanced",
        totalLessons: 15,
        lessons: [
            {
                id: 1,
                title: "Introduction to Aerospace Engineering",
                content: `
                    <h2>Welcome to Aerospace Engineering</h2>
                    <p>Aerospace engineering is one of the most exciting and challenging fields in engineering, combining the study of aeronautical engineering (aircraft) and astronautical engineering (spacecraft).</p>
                    
                    <h3>What is Aerospace Engineering?</h3>
                    <p>Aerospace engineering is the primary field of engineering concerned with the development of aircraft and spacecraft. It has two major and overlapping branches:</p>
                    <ul>
                        <li><strong>Aeronautical Engineering:</strong> Deals with aircraft that operate in Earth's atmosphere</li>
                        <li><strong>Astronautical Engineering:</strong> Deals with spacecraft that operate outside Earth's atmosphere</li>
                    </ul>
                    
                    <div class="lesson-visual">
                        <h4>Key Areas of Study</h4>
                        <ul>
                            <li>Aerodynamics and Fluid Mechanics</li>
                            <li>Propulsion Systems</li>
                            <li>Structural Analysis and Design</li>
                            <li>Materials Science</li>
                            <li>Control Systems</li>
                            <li>Avionics</li>
                        </ul>
                    </div>
                    
                    <h3>Historical Milestones</h3>
                    <p>The field has evolved tremendously since the Wright brothers' first flight in 1903. Key milestones include:</p>
                    <ul>
                        <li>1903: First powered flight by Wright brothers</li>
                        <li>1957: Launch of Sputnik 1, first artificial satellite</li>
                        <li>1969: Apollo 11 moon landing</li>
                        <li>1981: First Space Shuttle mission</li>
                        <li>2020: SpaceX Crew Dragon first crewed flight</li>
                    </ul>
                    
                    <p>Today, aerospace engineers work on cutting-edge projects including supersonic aircraft, Mars rovers, satellite constellations, and commercial space travel.</p>
                `,
                quiz: {
                    question: "What are the two major branches of aerospace engineering?",
                    options: [
                        "Mechanical and Electrical Engineering",
                        "Aeronautical and Astronautical Engineering",
                        "Civil and Chemical Engineering",
                        "Computer and Software Engineering"
                    ],
                    correct: 1
                }
            },
            {
                id: 2,
                title: "Fundamentals of Aerodynamics",
                content: `
                    <h2>Understanding Aerodynamics</h2>
                    <p>Aerodynamics is the study of the motion of air and how objects move through it. This fundamental science is crucial for designing everything from aircraft wings to spacecraft heat shields.</p>
                    
                    <h3>The Four Forces of Flight</h3>
                    <p>Every aircraft in flight experiences four fundamental forces:</p>
                    <ul>
                        <li><strong>Lift:</strong> Upward force generated by the wings</li>
                        <li><strong>Weight (Gravity):</strong> Downward force due to mass</li>
                        <li><strong>Thrust:</strong> Forward force from propulsion system</li>
                        <li><strong>Drag:</strong> Resistance force opposing motion</li>
                    </ul>
                    
                    <div class="lesson-visual">
                        <h4>Bernoulli's Principle</h4>
                        <p>One key principle in aerodynamics states that as the speed of a fluid increases, its pressure decreases. This helps explain how wings generate lift.</p>
                    </div>
                    
                    <h3>Airfoil Design</h3>
                    <p>An airfoil is the cross-sectional shape of a wing. Key characteristics include:</p>
                    <ul>
                        <li><strong>Camber:</strong> The asymmetry of the airfoil</li>
                        <li><strong>Thickness:</strong> Maximum distance between upper and lower surfaces</li>
                        <li><strong>Chord Line:</strong> Straight line from leading to trailing edge</li>
                        <li><strong>Angle of Attack:</strong> Angle between chord line and relative airflow</li>
                    </ul>
                    
                    <h3>Subsonic vs Supersonic Flow</h3>
                    <p>Aerodynamics behaves differently at various speeds:</p>
                    <ul>
                        <li><strong>Subsonic (M < 1):</strong> Air can be considered incompressible</li>
                        <li><strong>Supersonic (M > 1):</strong> Air compressibility becomes significant</li>
                        <li><strong>Hypersonic (M > 5):</strong> Additional effects like heating become critical</li>
                    </ul>
                `,
                quiz: {
                    question: "Which force is generated by aircraft wings to counteract weight?",
                    options: ["Thrust", "Drag", "Lift", "Pressure"],
                    correct: 2
                }
            },
            {
                id: 3,
                title: "Propulsion Systems",
                content: `
                    <h2>Propulsion in Aerospace</h2>
                    <p>Propulsion systems provide the thrust necessary to overcome drag and accelerate aircraft and spacecraft. Understanding these systems is crucial for aerospace engineers.</p>
                    
                    <h3>Aircraft Propulsion</h3>
                    <p>Aircraft use various types of engines depending on their mission requirements:</p>
                    
                    <h4>Propeller Engines</h4>
                    <ul>
                        <li>Most efficient at low speeds (< 400 mph)</li>
                        <li>Use reciprocating or turboprop engines</li>
                        <li>Convert rotational motion to thrust via propeller</li>
                    </ul>
                    
                    <h4>Jet Engines</h4>
                    <ul>
                        <li><strong>Turbojet:</strong> Simple design, high speed capability</li>
                        <li><strong>Turbofan:</strong> More efficient, quieter, used in commercial aircraft</li>
                        <li><strong>Turboprop:</strong> Combines jet engine with propeller efficiency</li>
                        <li><strong>Ramjet:</strong> Simple but only works at high speeds</li>
                    </ul>
                    
                    <div class="lesson-visual">
                        <h4>Newton's Third Law in Propulsion</h4>
                        <p>"For every action, there is an equal and opposite reaction." Jets work by accelerating air backward, creating forward thrust.</p>
                    </div>
                    
                    <h3>Rocket Propulsion</h3>
                    <p>Rockets work in the vacuum of space by carrying both fuel and oxidizer:</p>
                    
                    <h4>Chemical Rockets</h4>
                    <ul>
                        <li><strong>Solid Fuel:</strong> Simple, reliable, but not controllable once ignited</li>
                        <li><strong>Liquid Fuel:</strong> More complex but controllable and efficient</li>
                    </ul>
                    
                    <h4>Advanced Propulsion</h4>
                    <ul>
                        <li><strong>Ion Drives:</strong> Very efficient but low thrust</li>
                        <li><strong>Nuclear Thermal:</strong> High performance for deep space missions</li>
                        <li><strong>Solar Sails:</strong> Use radiation pressure from sunlight</li>
                    </ul>
                    
                    <h3>Specific Impulse</h3>
                    <p>A key measure of rocket efficiency - how long one pound of propellant can produce one pound of thrust. Higher specific impulse means more efficient propulsion.</p>
                `,
                quiz: {
                    question: "What law of physics explains how rocket propulsion works?",
                    options: [
                        "Newton's First Law",
                        "Newton's Second Law", 
                        "Newton's Third Law",
                        "Bernoulli's Principle"
                    ],
                    correct: 2
                }
            }
        ]
    },
    satellites: {
        title: "Satellite Technology",
        icon: "🛰️",
        description: "Explore orbital mechanics, communication systems, and satellite applications",
        difficulty: "Intermediate",
        totalLessons: 12,
        lessons: [
            {
                id: 1,
                title: "Introduction to Satellites",
                content: `
                    <h2>The World of Satellites</h2>
                    <p>Satellites are artificial objects placed in orbit around Earth or other celestial bodies. They've revolutionized communication, navigation, weather forecasting, and scientific research.</p>
                    
                    <h3>What is a Satellite?</h3>
                    <p>A satellite is any object that orbits another object. In aerospace, we typically refer to artificial satellites - human-made objects placed in orbit for specific purposes.</p>
                    
                    <div class="lesson-visual">
                        <h4>Types of Satellites by Function</h4>
                        <ul>
                            <li><strong>Communication Satellites:</strong> Relay TV, radio, internet, and phone signals</li>
                            <li><strong>Navigation Satellites:</strong> GPS, GLONASS, Galileo systems</li>
                            <li><strong>Weather Satellites:</strong> Monitor atmospheric conditions</li>
                            <li><strong>Earth Observation:</strong> Monitor land use, agriculture, disasters</li>
                            <li><strong>Scientific Satellites:</strong> Space telescopes, research platforms</li>
                            <li><strong>Military Satellites:</strong> Reconnaissance, secure communications</li>
                        </ul>
                    </div>
                    
                    <h3>Satellite Orbits</h3>
                    <p>Satellites operate in different orbital regions based on their mission:</p>
                    <ul>
                        <li><strong>LEO (Low Earth Orbit):</strong> 180-2000 km altitude</li>
                        <li><strong>MEO (Medium Earth Orbit):</strong> 2000-35,786 km altitude</li>
                        <li><strong>GEO (Geostationary Orbit):</strong> 35,786 km altitude</li>
                        <li><strong>HEO (High Earth Orbit):</strong> Above 35,786 km altitude</li>
                    </ul>
                    
                    <h3>Key Satellite Components</h3>
                    <ul>
                        <li><strong>Bus:</strong> The main structure and systems</li>
                        <li><strong>Payload:</strong> Mission-specific equipment</li>
                        <li><strong>Power System:</strong> Solar panels and batteries</li>
                        <li><strong>Communication System:</strong> Antennas and transponders</li>
                        <li><strong>Attitude Control:</strong> System to orient the satellite</li>
                        <li><strong>Propulsion:</strong> Thrusters for orbit adjustments</li>
                    </ul>
                    
                    <h3>Historical Timeline</h3>
                    <ul>
                        <li>1957: Sputnik 1 - First artificial satellite</li>
                        <li>1960: Echo 1 - First communication satellite</li>
                        <li>1962: Telstar 1 - First active communication satellite</li>
                        <li>1972: Landsat 1 - First Earth observation satellite</li>
                        <li>1978: GPS satellites begin deployment</li>
                        <li>1990: Hubble Space Telescope launched</li>
                    </ul>
                `,
                quiz: {
                    question: "What was the first artificial satellite launched into space?",
                    options: ["Explorer 1", "Telstar 1", "Sputnik 1", "Echo 1"],
                    correct: 2
                }
            },
            {
                id: 2,
                title: "Orbital Mechanics Fundamentals",
                content: `
                    <h2>Understanding Orbital Motion</h2>
                    <p>Orbital mechanics governs how satellites move through space. Understanding these principles is essential for satellite design and mission planning.</p>
                    
                    <h3>Kepler's Laws of Planetary Motion</h3>
                    <p>These fundamental laws, discovered by Johannes Kepler, apply to all orbiting objects:</p>
                    
                    <h4>First Law - Law of Ellipses</h4>
                    <p>All orbits are elliptical, with the central body at one focus of the ellipse.</p>
                    
                    <h4>Second Law - Law of Equal Areas</h4>
                    <p>A line connecting the satellite to the central body sweeps equal areas in equal time periods.</p>
                    
                    <h4>Third Law - Harmonic Law</h4>
                    <p>The square of the orbital period is proportional to the cube of the semi-major axis.</p>
                    
                    <div class="lesson-visual">
                        <h4>Orbital Elements</h4>
                        <p>Six parameters completely describe an orbit:</p>
                        <ul>
                            <li><strong>Semi-major axis (a):</strong> Size of the orbit</li>
                            <li><strong>Eccentricity (e):</strong> Shape of the orbit</li>
                            <li><strong>Inclination (i):</strong> Tilt of the orbital plane</li>
                            <li><strong>Right Ascension of Ascending Node (Ω):</strong> Orientation of orbital plane</li>
                            <li><strong>Argument of Periapsis (ω):</strong> Orientation of ellipse in plane</li>
                            <li><strong>True Anomaly (ν):</strong> Position in orbit</li>
                        </ul>
                    </div>
                    
                    <h3>Orbital Velocity</h3>
                    <p>The speed needed to maintain orbit depends on altitude:</p>
                    <ul>
                        <li><strong>LEO (400 km):</strong> ~7.7 km/s orbital velocity</li>
                        <li><strong>GEO (35,786 km):</strong> ~3.1 km/s orbital velocity</li>
                        <li><strong>Escape Velocity:</strong> ~11.2 km/s from Earth's surface</li>
                    </ul>
                    
                    <h3>Special Orbits</h3>
                    <ul>
                        <li><strong>Geostationary:</strong> Matches Earth's rotation, appears stationary</li>
                        <li><strong>Sun-Synchronous:</strong> Maintains constant solar illumination angle</li>
                        <li><strong>Molniya:</strong> Highly elliptical orbit for northern hemisphere coverage</li>
                        <li><strong>Polar:</strong> Passes over both poles, covers entire Earth</li>
                    </ul>
                    
                    <h3>Orbital Perturbations</h3>
                    <p>Real orbits are affected by various disturbances:</p>
                    <ul>
                        <li>Earth's oblateness (J2 effect)</li>
                        <li>Atmospheric drag (in low orbits)</li>
                        <li>Solar radiation pressure</li>
                        <li>Gravitational influences of Moon and Sun</li>
                    </ul>
                `,
                quiz: {
                    question: "What type of orbit appears stationary relative to Earth's surface?",
                    options: ["Polar orbit", "Sun-synchronous orbit", "Geostationary orbit", "Molniya orbit"],
                    correct: 2
                }
            }
        ]
    },
    astronomy: {
        title: "Astronomy",
        icon: "🌌",
        description: "Journey through the cosmos and understand celestial phenomena",
        difficulty: "Beginner",
        totalLessons: 18,
        lessons: [
            {
                id: 1,
                title: "Introduction to Astronomy",
                content: `
                    <h2>Welcome to the Universe</h2>
                    <p>Astronomy is the scientific study of celestial objects, space, and the physical universe as a whole. It's one of humanity's oldest sciences, inspiring wonder and driving technological advancement.</p>
                    
                    <h3>What is Astronomy?</h3>
                    <p>Astronomy encompasses the observation and study of:</p>
                    <ul>
                        <li>Stars and stellar evolution</li>
                        <li>Planets and planetary systems</li>
                        <li>Galaxies and galaxy formation</li>
                        <li>The structure and evolution of the universe</li>
                        <li>Dark matter and dark energy</li>
                        <li>Cosmic phenomena and events</li>
                    </ul>
                    
                    <div class="lesson-visual">
                        <h4>Branches of Astronomy</h4>
                        <ul>
                            <li><strong>Planetary Astronomy:</strong> Study of planets, moons, and small bodies</li>
                            <li><strong>Stellar Astronomy:</strong> Study of stars and stellar phenomena</li>
                            <li><strong>Galactic Astronomy:</strong> Study of our galaxy, the Milky Way</li>
                            <li><strong>Extragalactic Astronomy:</strong> Study of galaxies beyond our own</li>
                            <li><strong>Cosmology:</strong> Study of the universe as a whole</li>
                            <li><strong>Astrobiology:</strong> Search for life in the universe</li>
                        </ul>
                    </div>
                    
                    <h3>Scale of the Universe</h3>
                    <p>Understanding astronomical distances is crucial:</p>
                    <ul>
                        <li><strong>Astronomical Unit (AU):</strong> Earth-Sun distance (~150 million km)</li>
                        <li><strong>Light Year:</strong> Distance light travels in one year (~9.5 trillion km)</li>
                        <li><strong>Parsec:</strong> About 3.26 light years</li>
                        <li><strong>Observable Universe:</strong> About 93 billion light years diameter</li>
                    </ul>
                    
                    <h3>Tools of Modern Astronomy</h3>
                    <ul>
                        <li><strong>Optical Telescopes:</strong> Observe visible light</li>
                        <li><strong>Radio Telescopes:</strong> Detect radio waves from space</li>
                        <li><strong>X-ray Telescopes:</strong> Study high-energy phenomena</li>
                        <li><strong>Space Telescopes:</strong> Avoid atmospheric interference</li>
                        <li><strong>Spectroscopy:</strong> Analyze light to determine composition</li>
                        <li><strong>Computer Simulations:</strong> Model complex cosmic processes</li>
                    </ul>
                    
                    <h3>Recent Astronomical Discoveries</h3>
                    <ul>
                        <li>Detection of gravitational waves (2015)</li>
                        <li>First image of a black hole (2019)</li>
                        <li>Thousands of confirmed exoplanets</li>
                        <li>Evidence for dark matter and dark energy</li>
                        <li>Discovery of water on Mars and other worlds</li>
                    </ul>
                    
                    <p>Astronomy continues to push the boundaries of human knowledge, revealing the incredible complexity and beauty of our universe.</p>
                `,
                quiz: {
                    question: "What is the approximate diameter of the observable universe?",
                    options: ["93 million light years", "93 billion light years", "9.3 trillion light years", "93 trillion light years"],
                    correct: 1
                }
            },
            {
                id: 2,
                title: "Our Solar System",
                content: `
                    <h2>Exploring Our Cosmic Neighborhood</h2>
                    <p>Our solar system consists of the Sun, eight planets, their moons, and countless smaller objects. Understanding its structure and dynamics provides insights into planetary formation and evolution.</p>
                    
                    <h3>The Sun - Our Star</h3>
                    <p>The Sun is a G-type main-sequence star that provides energy for life on Earth:</p>
                    <ul>
                        <li><strong>Mass:</strong> 99.86% of the solar system's mass</li>
                        <li><strong>Composition:</strong> ~73% hydrogen, ~25% helium</li>
                        <li><strong>Temperature:</strong> 5,778 K surface, 15 million K core</li>
                        <li><strong>Energy Source:</strong> Nuclear fusion of hydrogen into helium</li>
                        <li><strong>Lifetime:</strong> About 10 billion years total (halfway through)</li>
                    </ul>
                    
                    <div class="lesson-visual">
                        <h4>The Eight Planets</h4>
                        <h5>Inner (Terrestrial) Planets:</h5>
                        <ul>
                            <li><strong>Mercury:</strong> Closest to Sun, extreme temperatures</li>
                            <li><strong>Venus:</strong> Hottest planet due to greenhouse effect</li>
                            <li><strong>Earth:</strong> Only known planet with life</li>
                            <li><strong>Mars:</strong> Red planet with polar ice caps</li>
                        </ul>
                        
                        <h5>Outer (Gas Giant) Planets:</h5>
                        <ul>
                            <li><strong>Jupiter:</strong> Largest planet, Great Red Spot</li>
                            <li><strong>Saturn:</strong> Famous ring system</li>
                            <li><strong>Uranus:</strong> Tilted on its side, ice giant</li>
                            <li><strong>Neptune:</strong> Windiest planet, furthest from Sun</li>
                        </ul>
                    </div>
                    
                    <h3>Formation of the Solar System</h3>
                    <p>The nebular hypothesis explains how our solar system formed 4.6 billion years ago:</p>
                    <ol>
                        <li><strong>Solar Nebula:</strong> Collapse of a giant molecular cloud</li>
                        <li><strong>Accretion Disk:</strong> Formation of a rotating disk</li>
                        <li><strong>Planetary Formation:</strong> Dust grains stick together</li>
                        <li><strong>Differentiation:</strong> Heavy elements sink, light elements rise</li>
                        <li><strong>Late Heavy Bombardment:</strong> Period of intense impacts</li>
                    </ol>
                    
                    <h3>Small Solar System Bodies</h3>
                    <ul>
                        <li><strong>Asteroids:</strong> Rocky remnants, mainly in asteroid belt</li>
                        <li><strong>Comets:</strong> Icy bodies from outer solar system</li>
                        <li><strong>Meteoroids:</strong> Small rocky or metallic bodies</li>
                        <li><strong>Kuiper Belt Objects:</strong> Icy bodies beyond Neptune</li>
                        <li><strong>Oort Cloud:</strong> Spherical shell of comets at solar system edge</li>
                    </ul>
                    
                    <h3>Moons and Ring Systems</h3>
                    <p>Many planets have fascinating satellite systems:</p>
                    <ul>
                        <li><strong>Earth's Moon:</strong> Formed by giant impact, stabilizes Earth's tilt</li>
                        <li><strong>Jupiter's Moons:</strong> Io (volcanic), Europa (subsurface ocean)</li>
                        <li><strong>Saturn's Rings:</strong> Made of ice and rock particles</li>
                        <li><strong>Titan:</strong> Saturn's moon with thick atmosphere and lakes</li>
                    </ul>
                `,
                quiz: {
                    question: "How many planets are currently recognized in our solar system?",
                    options: ["7", "8", "9", "10"],
                    correct: 1
                }
            }
        ]
    }
};

// Badge System
const BadgeSystem = {
    badges: [
        { id: 'first_lesson', name: 'First Steps', icon: '👶', description: 'Complete your first lesson' },
        { id: 'quiz_master', name: 'Quiz Master', icon: '🧠', description: 'Pass 5 quizzes' },
        { id: 'week_streak', name: 'Consistent', icon: '🔥', description: 'Maintain a 7-day streak' },
        { id: 'course_complete', name: 'Graduate', icon: '🎓', description: 'Complete a full course' },
        { id: 'speed_learner', name: 'Speed Learner', icon: '⚡', description: 'Complete 3 lessons in one day' },
        { id: 'explorer', name: 'Explorer', icon: '🚀', description: 'Start all three courses' },
        { id: 'perfectionist', name: 'Perfectionist', icon: '💯', description: 'Get 100% on 5 quizzes' },
        { id: 'dedicated', name: 'Dedicated', icon: '💪', description: 'Study for 30 days total' }
    ],

    checkAndAwardBadge(badgeId) {
        if (!AppState.userProgress.badges.includes(badgeId)) {
            AppState.userProgress.badges.push(badgeId);
            this.showBadgeNotification(badgeId);
            saveUserData();
        }
    },

    showBadgeNotification(badgeId) {
        const badge = this.badges.find(b => b.id === badgeId);
        if (badge) {
            showNotification(`Badge Earned: ${badge.icon} ${badge.name}`, badge.description);
        }
    }
};

// Chat AI Responses
const ChatAI = {
    responses: {
        'hello': "Hello! I'm here to help you learn about aerospace engineering, satellites, and astronomy. What would you like to know?",
        'help': "I can answer questions about:\n- Aerospace engineering principles\n- Satellite technology and orbits\n- Astronomy and space science\n- Course navigation\n- Study tips",
        'aerospace': "Aerospace engineering combines aeronautical engineering (aircraft) and astronautical engineering (spacecraft). Key areas include aerodynamics, propulsion, structures, and controls.",
        'satellite': "Satellites are objects that orbit Earth or other celestial bodies. They're used for communication, navigation, weather monitoring, and scientific research.",
        'orbit': "An orbit is the curved path of an object around a star, planet, or moon. The shape and size of orbits are determined by gravity and the object's velocity.",
        'astronomy': "Astronomy is the scientific study of celestial objects and phenomena. It includes studying stars, planets, galaxies, and the universe as a whole.",
        'rocket': "Rockets work by Newton's third law - they expel mass (exhaust) in one direction to create thrust in the opposite direction. They carry both fuel and oxidizer.",
        'space': "Space begins at the Kármán line, 100 km above Earth's surface. It's characterized by vacuum conditions, radiation, and microgravity.",
        'mars': "Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It has the largest volcano and canyon in the solar system.",
        'moon': "Earth's Moon formed about 4.5 billion years ago, likely from debris after a Mars-sized object collided with Earth. It stabilizes Earth's tilt and creates tides."
    },

    getResponse(message) {
        const msg = message.toLowerCase();
        
        // Check for exact matches first
        for (const [key, response] of Object.entries(this.responses)) {
            if (msg.includes(key)) {
                return response;
            }
        }
        
        // Generic responses for common patterns
        if (msg.includes('how') || msg.includes('what') || msg.includes('why') || msg.includes('when')) {
            return "That's a great question! Based on the courses available, I'd recommend checking the specific lessons that cover this topic. You can also ask me more specific questions about aerospace, satellites, or astronomy.";
        }
        
        if (msg.includes('thank')) {
            return "You're welcome! Keep exploring and learning. The universe is full of amazing discoveries waiting for you! 🚀";
        }
        
        return "I'd love to help! Try asking me about aerospace engineering, satellites, orbital mechanics, or astronomy. You can also ask 'help' to see what topics I cover.";
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserData();
    updateCursorGlow();
});

function initializeApp() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Set up course cards
    const courseCards = document.querySelectorAll('.course-card, .detailed-course-card');
    courseCards.forEach(card => {
        const courseBtn = card.querySelector('.course-btn');
        if (courseBtn) {
            courseBtn.addEventListener('click', () => {
                const courseId = card.getAttribute('data-course');
                startCourse(courseId);
            });
        }
    });

    // Initialize user interface
    updateUserInterface();
    renderBadges();
}

function setupEventListeners() {
    // Login/Logout functionality
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('closeLoginModal').addEventListener('click', hideLoginModal);

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.getAttribute('data-tab');
            switchAuthTab(tabType);
        });
    });

    // Auth forms
    document.getElementById('loginSubmit').addEventListener('click', handleLogin);
    document.getElementById('signupSubmit').addEventListener('click', handleSignup);
    document.getElementById('googleLogin').addEventListener('click', () => handleGoogleAuth('login'));
    document.getElementById('googleSignup').addEventListener('click', () => handleGoogleAuth('signup'));

    // Course navigation
    document.getElementById('prevLessonBtn').addEventListener('click', previousLesson);
    document.getElementById('nextLessonBtn').addEventListener('click', nextLesson);

    // Quiz functionality
    document.getElementById('closeQuizModal').addEventListener('click', hideQuizModal);

    // Certificate functionality
    document.getElementById('closeCertificateModal').addEventListener('click', hideCertificateModal);
    document.getElementById('generateCertificate').addEventListener('click', generateCertificate);

    // Chat functionality
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('sendChatMessage').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Workspace functionality
    document.getElementById('openWorkspace').addEventListener('click', toggleWorkspace);
    document.getElementById('workspaceToggle').addEventListener('click', toggleWorkspace);
    document.getElementById('saveNotes').addEventListener('click', saveNotes);

    // Load saved notes
    const savedNotes = localStorage.getItem('userNotes');
    if (savedNotes) {
        document.getElementById('notesArea').value = savedNotes;
    }
}

function updateCursorGlow() {
    const cursor = document.querySelector('.cursor-glow');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
}

// Navigation Functions
function navigateToPage(page) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');

    AppState.currentPage = page;

    if (page === 'courses') {
        updateCoursesPage();
    }
}

function startCourse(courseId) {
    AppState.currentCourse = courseId;
    AppState.currentLesson = 0;
    
    navigateToPage('courses');
    showCourseContent();
    
    // Award explorer badge if user has started all courses
    const startedCourses = Object.keys(AppState.userProgress.completedLessons);
    if (startedCourses.length === 3) {
        BadgeSystem.checkAndAwardBadge('explorer');
    }
}

function showCourseContent() {
    document.getElementById('coursesOverview').classList.add('hidden');
    document.getElementById('courseContent').classList.remove('hidden');
    
    const course = CoursesData[AppState.currentCourse];
    document.getElementById('currentCourseTitle').textContent = course.title;
    
    renderLessonsList();
    loadLesson(AppState.currentLesson);
    updateCourseProgress();
}

// Lesson Management
function renderLessonsList() {
    const course = CoursesData[AppState.currentCourse];
    const lessonsList = document.getElementById('lessonsList');
    lessonsList.innerHTML = '';
    
    course.lessons.forEach((lesson, index) => {
        const isCompleted = isLessonCompleted(AppState.currentCourse, index);
        const isActive = index === AppState.currentLesson;
        
        const lessonItem = document.createElement('div');
        lessonItem.className = `lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        lessonItem.innerHTML = `
            <div class="lesson-status ${isCompleted ? 'completed' : ''}">${isCompleted ? '✓' : index + 1}</div>
            <span>${lesson.title}</span>
        `;
        
        lessonItem.addEventListener('click', () => {
            AppState.currentLesson = index;
            loadLesson(index);
            renderLessonsList();
        });
        
        lessonsList.appendChild(lessonItem);
    });
}

function loadLesson(lessonIndex) {
    const course = CoursesData[AppState.currentCourse];
    const lesson = course.lessons[lessonIndex];
    
    if (!lesson) return;
    
    const content = document.getElementById('lessonContent');
    content.innerHTML = lesson.content;
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    prevBtn.disabled = lessonIndex === 0;
    nextBtn.disabled = lessonIndex >= course.lessons.length - 1;
    
    // Check for first lesson badge
    BadgeSystem.checkAndAwardBadge('first_lesson');
}

function previousLesson() {
    if (AppState.currentLesson > 0) {
        AppState.currentLesson--;
        loadLesson(AppState.currentLesson);
        renderLessonsList();
    }
}

function nextLesson() {
    const course = CoursesData[AppState.currentCourse];
    const currentLesson = course.lessons[AppState.currentLesson];
    
    if (currentLesson && currentLesson.quiz) {
        showQuiz(currentLesson.quiz);
    } else {
        proceedToNextLesson();
    }
}

function proceedToNextLesson() {
    const course = CoursesData[AppState.currentCourse];
    
    // Mark current lesson as completed
    markLessonCompleted(AppState.currentCourse, AppState.currentLesson);
    
    if (AppState.currentLesson < course.lessons.length - 1) {
        AppState.currentLesson++;
        loadLesson(AppState.currentLesson);
        renderLessonsList();
        updateCourseProgress();
    } else {
        // Course completed
        completeCourse(AppState.currentCourse);
    }
}

// Quiz System
function showQuiz(quizData) {
    const modal = document.getElementById('quizModal');
    const content = document.getElementById('quizContent');
    
    content.innerHTML = `
        <div class="quiz-question">
            <h3>${quizData.question}</h3>
            <div class="quiz-options">
                ${quizData.options.map((option, index) => `
                    <div class="quiz-option" data-option="${index}">
                        <input type="radio" name="quiz-answer" id="option-${index}" value="${index}">
                        <label for="option-${index}">${option}</label>
                    </div>
                `).join('')}
            </div>
            <div class="quiz-actions">
                <button class="quiz-btn secondary" onclick="hideQuizModal()">Cancel</button>
                <button class="quiz-btn" onclick="submitQuiz(${quizData.correct})">Submit Answer</button>
            </div>
        </div>
    `;
    
    // Add click handlers to options
    content.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
            content.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            option.querySelector('input').checked = true;
        });
    });
    
    modal.classList.add('active');
}

function submitQuiz(correctAnswer) {
    const selectedOption = document.querySelector('input[name="quiz-answer"]:checked');
    
    if (!selectedOption) {
        alert('Please select an answer before submitting.');
        return;
    }
    
    const userAnswer = parseInt(selectedOption.value);
    const isCorrect = userAnswer === correctAnswer;
    
    showQuizResults(isCorrect);
    
    if (isCorrect) {
        AppState.userProgress.xp += 10;
        updateLevel();
        BadgeSystem.checkAndAwardBadge('quiz_master');
    }
    
    saveUserData();
}

function showQuizResults(isCorrect) {
    const content = document.getElementById('quizContent');
    
    content.innerHTML = `
        <div class="quiz-results">
            <div class="quiz-score">${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</div>
            <div class="quiz-feedback">
                ${isCorrect ? 'Great job! You earned 10 XP points.' : 'Don\'t worry, learning is a process. Review the lesson and try again!'}
            </div>
            <div class="quiz-actions">
                <button class="quiz-btn" onclick="hideQuizModal(); ${isCorrect ? 'proceedToNextLesson()' : 'loadLesson(AppState.currentLesson)'}">
                    ${isCorrect ? 'Continue' : 'Review Lesson'}
                </button>
            </div>
        </div>
    `;
}

function hideQuizModal() {
    document.getElementById('quizModal').classList.remove('active');
}

// Progress Tracking
function markLessonCompleted(courseId, lessonIndex) {
    if (!AppState.userProgress.completedLessons[courseId]) {
        AppState.userProgress.completedLessons[courseId] = [];
    }
    
    if (!AppState.userProgress.completedLessons[courseId].includes(lessonIndex)) {
        AppState.userProgress.completedLessons[courseId].push(lessonIndex);
        AppState.userProgress.xp += 25;
        updateLevel();
        updateStreak();
        saveUserData();
    }
}

function isLessonCompleted(courseId, lessonIndex) {
    return AppState.userProgress.completedLessons[courseId] && 
           AppState.userProgress.completedLessons[courseId].includes(lessonIndex);
}

function completeCourse(courseId) {
    BadgeSystem.checkAndAwardBadge('course_complete');
    AppState.userProgress.xp += 100;
    updateLevel();
    showCertificateModal(courseId);
    saveUserData();
}

function updateCourseProgress() {
    const course = CoursesData[AppState.currentCourse];
    const completedLessons = AppState.userProgress.completedLessons[AppState.currentCourse] || [];
    const progress = Math.round((completedLessons.length / course.lessons.length) * 100);
    
    document.getElementById('courseProgressFill').style.width = progress + '%';
    document.getElementById('courseProgressText').textContent = progress + '% Complete';
    
    // Update detailed course cards
    const courseCard = document.querySelector(`[data-course="${AppState.currentCourse}"]`);
    if (courseCard) {
        const progressBar = courseCard.querySelector('[data-course-progress]');
        const progressText = courseCard.querySelector('.progress-percentage');
        if (progressBar && progressText) {
            progressBar.style.width = progress + '%';
            progressText.textContent = progress + '%';
        }
    }
}

function updateCoursesPage() {
    // Update all course progress bars
    Object.keys(CoursesData).forEach(courseId => {
        const course = CoursesData[courseId];
        const completedLessons = AppState.userProgress.completedLessons[courseId] || [];
        const progress = Math.round((completedLessons.length / course.lessons.length) * 100);
        
        const progressBar = document.querySelector(`[data-course-progress="${courseId}"]`);
        const progressText = progressBar?.parentElement.querySelector('.progress-percentage');
        
        if (progressBar && progressText) {
            progressBar.style.width = progress + '%';
            progressText.textContent = progress + '%';
        }
    });
    
    renderBadges();
}

// User Management
function updateLevel() {
    const newLevel = Math.floor(AppState.userProgress.xp / 100) + 1;
    if (newLevel > AppState.userProgress.level) {
        AppState.userProgress.level = newLevel;
        showNotification('Level Up!', `You've reached level ${newLevel}!`);
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = AppState.userProgress.lastLoginDate;
    
    if (lastLogin !== today) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (lastLogin === yesterday) {
            AppState.userProgress.streak++;
            if (AppState.userProgress.streak >= 7) {
                BadgeSystem.checkAndAwardBadge('week_streak');
            }
        } else if (lastLogin !== today) {
            AppState.userProgress.streak = 1;
        }
        
        AppState.userProgress.lastLoginDate = today;
    }
}

function updateUserInterface() {
    if (AppState.currentUser) {
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('userProfile').classList.remove('hidden');
        document.getElementById('userName').textContent = AppState.currentUser.name;
        
        // Update progress display
        document.getElementById('currentStreak').textContent = `${AppState.userProgress.streak} days`;
        document.getElementById('currentLevel').textContent = AppState.userProgress.level;
        document.getElementById('totalXP').textContent = AppState.userProgress.xp;
    } else {
        document.getElementById('loginBtn').classList.remove('hidden');
        document.getElementById('userProfile').classList.add('hidden');
    }
}

// Authentication
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function switchAuthTab(tabType) {
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
    
    document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
    document.getElementById(`${tabType}Form`).classList.remove('hidden');
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Simulate login
    const userData = localStorage.getItem(`user_${email}`);
    if (userData) {
        const user = JSON.parse(userData);
        if (user.password === password) {
            loginUser(user);
        } else {
            alert('Invalid password');
        }
    } else {
        alert('User not found');
    }
}

function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Check if user already exists
    if (localStorage.getItem(`user_${email}`)) {
        alert('User already exists');
        return;
    }
    
    // Create new user
    const user = { name, email, password };
    localStorage.setItem(`user_${email}`, JSON.stringify(user));
    
    loginUser(user);
}

function handleGoogleAuth(type) {
    // Simulate Google authentication
    const mockUser = {
        name: 'Space Explorer',
        email: 'explorer@spaceed.com',
        password: 'google_auth'
    };
    
    localStorage.setItem(`user_${mockUser.email}`, JSON.stringify(mockUser));
    loginUser(mockUser);
}

function loginUser(user) {
    AppState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    updateStreak();
    updateUserInterface();
    hideLoginModal();
    
    showNotification('Welcome!', `Good to see you, ${user.name}!`);
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();
    
    // Reset to home page
    navigateToPage('home');
}

// Certificate System
function showCertificateModal(courseId) {
    const course = CoursesData[courseId];
    document.getElementById('certificateModal').classList.add('active');
}

function generateCertificate() {
    const name = document.getElementById('certificateName').value;
    if (!name.trim()) {
        alert('Please enter your name');
        return;
    }
    
    const course = CoursesData[AppState.currentCourse];
    const canvas = document.getElementById('certificateCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Add inner border
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Certificate title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 120);
    
    // Course title
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.fillText(course.title, canvas.width / 2, 200);
    
    // Award text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('This certifies that', canvas.width / 2, 250);
    
    // Student name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText(name, canvas.width / 2, 300);
    
    // Completion text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('has successfully completed the advanced course in', canvas.width / 2, 340);
    ctx.fillText(`${course.title}`, canvas.width / 2, 370);
    
    // Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, sans-serif';
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    ctx.fillText(`Completed on ${currentDate}`, canvas.width / 2, 450);
    
    // Signature line
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SpaceEd Pro Academy', 100, 520);
    ctx.fillText('Director of Education', 100, 540);
    
    // Course icon
    ctx.font = '60px Arial';
    ctx.fillText(course.icon, canvas.width - 150, 520);
    
    // Display certificate
    const preview = document.getElementById('certificatePreview');
    preview.innerHTML = `
        <div class="certificate">
            <img src="${canvas.toDataURL()}" alt="Certificate" style="max-width: 100%; height: auto;">
            <button class="download-btn" onclick="downloadCertificate()">Download Certificate</button>
        </div>
    `;
}

function downloadCertificate() {
    const canvas = document.getElementById('certificateCanvas');
    const link = document.createElement('a');
    link.download = `SpaceEd_Certificate_${AppState.currentCourse}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function hideCertificateModal() {
    document.getElementById('certificateModal').classList.remove('active');
    document.getElementById('certificatePreview').innerHTML = '';
}

// Chat System
function toggleChat() {
    const chatBody = document.getElementById('chatBody');
    const toggle = document.getElementById('chatToggle');
    
    if (chatBody.classList.contains('collapsed')) {
        chatBody.classList.remove('collapsed');
        toggle.textContent = '−';
    } else {
        chatBody.classList.add('collapsed');
        toggle.textContent = '+';
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Get AI response
    setTimeout(() => {
        const response = ChatAI.getResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Workspace System
function toggleWorkspace() {
    const workspace = document.getElementById('workspaceWidget');
    workspace.classList.toggle('active');
}

function saveNotes() {
    const notes = document.getElementById('notesArea').value;
    localStorage.setItem('userNotes', notes);
    showNotification('Notes Saved', 'Your notes have been saved successfully.');
}

// Badge System
function renderBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    badgesGrid.innerHTML = '';
    
    BadgeSystem.badges.forEach(badge => {
        const isEarned = AppState.userProgress.badges.includes(badge.id);
        const badgeEl = document.createElement('div');
        badgeEl.className = `badge ${isEarned ? 'earned' : ''}`;
        badgeEl.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
        `;
        badgeEl.title = badge.description;
        badgesGrid.appendChild(badgeEl);
    });
}

// Data Persistence
function saveUserData() {
    if (AppState.currentUser) {
        const userData = {
            progress: AppState.userProgress,
            currentCourse: AppState.currentCourse,
            currentLesson: AppState.currentLesson
        };
        localStorage.setItem(`userData_${AppState.currentUser.email}`, JSON.stringify(userData));
    }
}

function loadUserData() {
    // Load current user
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        AppState.currentUser = JSON.parse(currentUser);
        
        // Load user progress
        const userData = localStorage.getItem(`userData_${AppState.currentUser.email}`);
        if (userData) {
            const data = JSON.parse(userData);
            AppState.userProgress = { ...AppState.userProgress, ...data.progress };
            AppState.currentCourse = data.currentCourse;
            AppState.currentLesson = data.currentLesson || 0;
        }
        
        updateStreak();
        updateUserInterface();
    }
}

// Utility Functions
function showNotification(title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #6366f1, #0ea5e9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        z-index: 10000;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 0.5rem;">${title}</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// Page transition effects
function addPageTransition() {
    document.querySelectorAll('.page.active').forEach(page => {
        page.classList.add('animate-fade-in');
        setTimeout(() => {
            page.classList.remove('animate-fade-in');
        }, 500);
    });
}

// Course completion tracking
function checkDailyProgress() {
    const today = new Date().toDateString();
    const dailyLessons = localStorage.getItem(`daily_${today}`) || 0;
    
    if (parseInt(dailyLessons) >= 3) {
        BadgeSystem.checkAndAwardBadge('speed_learner');
    }
}

// Initialize daily progress tracking
setInterval(checkDailyProgress, 60000); // Check every minute