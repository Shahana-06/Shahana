// Memoria - Community Time Capsule App
// Complete JavaScript Implementation with AR, Authentication, and Database

// ===== SUPABASE CONFIGURATION =====
// For now, we'll use a mock/demo mode until you set up Supabase
const SUPABASE_URL = 'https://gtviszfobbkewhuydtcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmlzemZvYmJrZXdodXlkdGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTczMzUsImV4cCI6MjA3NDAzMzMzNX0.ebduH-So7XZfyh3vtF5KAsslH_qJXIfRqvgjBlVJVQo';

// Mock Supabase for demo purposes
const supabase = {
  auth: {
    signUp: () => Promise.resolve({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: { user: { id: 'demo-user', email: 'demo@example.com' } } } }),
    onAuthStateChange: () => {}
  },
  from: () => ({
    insert: () => ({ select: () => Promise.resolve({ data: [{ id: 'demo-memory' }], error: null }) }),
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null })
    }),
    delete: () => ({
      eq: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    })
  })
};

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let userLocation = null;
let placedMarkers = [];
let arScene = null;

// ===== UTILITY FUNCTIONS =====

// Get user's current location
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        resolve(userLocation);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== AUTHENTICATION FUNCTIONS =====

// Register new user
async function registerUser(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
            created_at: new Date().toISOString()
          }
        ]);

      if (profileError) console.error('Profile creation error:', profileError);
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    currentUser = data.user;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Logout user
async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    currentUser = null;
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Check authentication state
async function checkAuthState() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    return currentUser;
  }
  
  return null;
}

// ===== DATABASE FUNCTIONS =====

// Save memory to database
async function saveMemory(memoryData) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          id: generateId(),
          user_id: currentUser.id,
          text: memoryData.text,
          latitude: memoryData.latitude,
          longitude: memoryData.longitude,
          ar_position_x: memoryData.ar_position_x || null,
          ar_position_y: memoryData.ar_position_y || null,
          ar_position_z: memoryData.ar_position_z || null,
          visibility: memoryData.visibility || 'public',
          is_anonymous: memoryData.is_anonymous || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Save memory error:', error);
    return { success: false, error: error.message };
  }
}

// Get memories near location
async function getMemoriesNearLocation(lat, lng, radius = 50) {
  try {
    // Get all memories first, then filter by distance (for simplicity)
    // In production, you'd use PostGIS for proper geo queries
    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        profiles!memories_user_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter by distance
    const nearbyMemories = data.filter(memory => {
      const distance = calculateDistance(lat, lng, memory.latitude, memory.longitude);
      return distance <= radius;
    });

    return { success: true, data: nearbyMemories };
  } catch (error) {
    console.error('Get memories error:', error);
    return { success: false, error: error.message };
  }
}

// Get user's memories
async function getUserMemories(userId) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data };
  } catch (error) {
    console.error('Get user memories error:', error);
    return { success: false, error: error.message };
  }
}

// Delete memory
async function deleteMemory(memoryId, userId) {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete memory error:', error);
    return { success: false, error: error.message };
  }
}

// ===== AR FUNCTIONS =====

// Initialize AR scene for posting memories
function initializePostMemoryAR() {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  let isPlacingMemory = false;
  let memoryText = '';
  let memoryVisibility = 'public';
  let isAnonymous = false;

  // WebXR Hit Test Setup
  if ('xr' in navigator && 'XRSystem' in window) {
    setupWebXRHitTest(sceneEl);
  } else {
    // Fallback for browsers without WebXR
    setupBasicARPlacement(sceneEl);
  }
}

// Setup WebXR Hit Test (for compatible browsers)
async function setupWebXRHitTest(sceneEl) {
  try {
    // Check if WebXR is supported
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      console.log('WebXR AR not supported, using fallback');
      setupBasicARPlacement(sceneEl);
      return;
    }

    // Create WebXR session
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test']
    });

    // Setup hit test source
    const referenceSpace = await session.requestReferenceSpace('local');
    const hitTestSource = await session.requestHitTestSource({ space: referenceSpace });

    // Handle hit test results
    session.requestAnimationFrame(function onXRFrame(time, frame) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(referenceSpace);
        
        // Update reticle position
        updateReticle(hitPose.transform);
      }

      session.requestAnimationFrame(onXRFrame);
    });

  } catch (error) {
    console.log('WebXR setup failed, using fallback:', error);
    setupBasicARPlacement(sceneEl);
  }
}

// Basic AR placement fallback
function setupBasicARPlacement(sceneEl) {
  let reticle = null;
  let placedMemory = null;

  // Create reticle
  reticle = document.createElement('a-ring');
  reticle.setAttribute('id', 'reticle');
  reticle.setAttribute('radius-inner', '0.02');
  reticle.setAttribute('radius-outer', '0.05');
  reticle.setAttribute('color', '#ff4081');
  reticle.setAttribute('position', '0 0 -2');
  reticle.setAttribute('rotation', '-90 0 0');
  sceneEl.appendChild(reticle);

  // Handle screen tap/click for placement
  sceneEl.addEventListener('click', async function(event) {
    if (placedMemory) return; // Only allow one placement

    // Get memory details from modal/form
    const memoryData = await showMemoryInputModal();
    if (!memoryData) return;

    // Create 3D memory object
    const memoryEntity = document.createElement('a-entity');
    memoryEntity.setAttribute('id', 'placed-memory');
    
    // Create visual representation
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', '0.1');
    sphere.setAttribute('color', '#ff4081');
    sphere.setAttribute('opacity', '0.8');
    
    const text = document.createElement('a-text');
    text.setAttribute('value', memoryData.text.substring(0, 50) + '...');
    text.setAttribute('position', '0 0.15 0');
    text.setAttribute('align', 'center');
    text.setAttribute('color', '#fff');
    text.setAttribute('background-color', '#000');
    text.setAttribute('background-opacity', '0.7');
    text.setAttribute('width', '4');

    memoryEntity.appendChild(sphere);
    memoryEntity.appendChild(text);
    
    // Position at reticle location
    const reticlePos = reticle.getAttribute('position');
    memoryEntity.setAttribute('position', reticlePos);
    
    sceneEl.appendChild(memoryEntity);
    placedMemory = memoryEntity;

    // Hide reticle
    reticle.setAttribute('visible', false);

    // Show save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.style.display = 'block';
      saveBtn.onclick = () => saveArMemory(memoryData, reticlePos);
    }
  });
}

// Show memory input modal
function showMemoryInputModal() {
  return new Promise((resolve) => {
    // Create modal HTML
    const modalHTML = `
      <div id="memoryModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 15px;
          width: 90%;
          max-width: 400px;
        ">
          <h3 style="margin-top: 0;">✍️ Write Your Memory</h3>
          <textarea id="memoryText" placeholder="What happened here?" style="
            width: 100%;
            height: 100px;
            margin: 1rem 0;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: vertical;
          "></textarea>
          <div style="margin: 1rem 0;">
            <label>
              <input type="checkbox" id="isAnonymous"> Post anonymously
            </label>
          </div>
          <div style="margin: 1rem 0;">
            <label>Visibility: </label>
            <select id="visibility" style="margin-left: 0.5rem;">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button onclick="submitMemory()" style="
              flex: 1;
              padding: 0.8rem;
              background: #ff4081;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">Place Memory</button>
            <button onclick="cancelMemory()" style="
              flex: 1;
              padding: 0.8rem;
              background: #ccc;
              color: black;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Handle submit
    window.submitMemory = () => {
      const text = document.getElementById('memoryText').value.trim();
      const isAnonymous = document.getElementById('isAnonymous').checked;
      const visibility = document.getElementById('visibility').value;

      if (!text) {
        alert('Please write a memory!');
        return;
      }

      document.getElementById('memoryModal').remove();
      delete window.submitMemory;
      delete window.cancelMemory;

      resolve({
        text,
        isAnonymous,
        visibility
      });
    };

    // Handle cancel
    window.cancelMemory = () => {
      document.getElementById('memoryModal').remove();
      delete window.submitMemory;
      delete window.cancelMemory;
      resolve(null);
    };
  });
}

// Save AR memory with position data
async function saveArMemory(memoryData, position) {
  try {
    // Get current location
    const location = await getCurrentLocation();
    
    const fullMemoryData = {
      text: memoryData.text,
      latitude: location.lat,
      longitude: location.lng,
      ar_position_x: position.x,
      ar_position_y: position.y,
      ar_position_z: position.z,
      visibility: memoryData.visibility,
      is_anonymous: memoryData.isAnonymous
    };

    const result = await saveMemory(fullMemoryData);
    
    if (result.success) {
      alert('Memory saved successfully! 🎉');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    } else {
      alert('Failed to save memory: ' + result.error);
    }
  } catch (error) {
    console.error('Save AR memory error:', error);
    alert('Error saving memory. Please try again.');
  }
}

// Initialize AR scene for viewing memories
async function initializeViewMemoriesAR() {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  try {
    // Get current location
    const location = await getCurrentLocation();
    
    // Load nearby memories
    const result = await getMemoriesNearLocation(location.lat, location.lng, 50);
    
    if (result.success) {
      displayMemoriesInAR(sceneEl, result.data);
    } else {
      console.error('Failed to load memories:', result.error);
    }
  } catch (error) {
    console.error('Initialize view memories AR error:', error);
  }
}

// Display memories in AR space
function displayMemoriesInAR(sceneEl, memories) {
  memories.forEach((memory, index) => {
    // Create memory entity
    const memoryEntity = document.createElement('a-entity');
    memoryEntity.setAttribute('id', `memory-${memory.id}`);
    
    // Use AR position if available, otherwise place randomly
    let position;
    if (memory.ar_position_x !== null) {
      position = `${memory.ar_position_x} ${memory.ar_position_y} ${memory.ar_position_z}`;
    } else {
      // Random placement in a circle around user
      const angle = (index / memories.length) * Math.PI * 2;
      const radius = 2;
      position = `${Math.cos(angle) * radius} 1 ${Math.sin(angle) * radius}`;
    }
    
    memoryEntity.setAttribute('position', position);
    
    // Create visual representation
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', '0.15');
    sphere.setAttribute('color', memory.visibility === 'private' ? '#ff6b6b' : '#4ecdc4');
    sphere.setAttribute('opacity', '0.8');
    
    const text = document.createElement('a-text');
    const displayName = memory.is_anonymous ? 'Anonymous' : 
                       (memory.profiles?.full_name || 'Unknown User');
    text.setAttribute('value', `${memory.text.substring(0, 30)}...\n- ${displayName}`);
    text.setAttribute('position', '0 0.25 0');
    text.setAttribute('align', 'center');
    text.setAttribute('color', '#333');
    text.setAttribute('background-color', '#fff');
    text.setAttribute('background-opacity', '0.9');
    text.setAttribute('width', '6');
    
    // Add click interaction
    memoryEntity.addEventListener('click', () => {
      showMemoryDetail(memory);
    });
    
    memoryEntity.appendChild(sphere);
    memoryEntity.appendChild(text);
    sceneEl.appendChild(memoryEntity);
  });

  // Update header with count
  const header = document.querySelector('.header');
  if (header) {
    header.textContent = `📍 Found ${memories.length} memories nearby`;
  }
}

// Show detailed memory view
function showMemoryDetail(memory) {
  const displayName = memory.is_anonymous ? 'Anonymous' : 
                     (memory.profiles?.full_name || 'Unknown User');
  
  const modalHTML = `
    <div id="memoryDetailModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 15px;
        width: 90%;
        max-width: 400px;
      ">
        <h3 style="margin-top: 0; color: #333;">💭 Memory</h3>
        <p style="font-size: 1.1rem; margin: 1rem 0;">${memory.text}</p>
        <p style="color: #666; font-size: 0.9rem;">
          By: ${displayName}<br>
          Visibility: ${memory.visibility}<br>
          Created: ${new Date(memory.created_at).toLocaleDateString()}
        </p>
        <button onclick="closeMemoryDetail()" style="
          width: 100%;
          padding: 0.8rem;
          background: #ff4081;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
        ">Close</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  window.closeMemoryDetail = () => {
    document.getElementById('memoryDetailModal').remove();
    delete window.closeMemoryDetail;
  };
}

// ===== PAGE-SPECIFIC INITIALIZATION =====

// Initialize login page
function initializeLoginPage() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    const result = await loginUser(email, password);
    
    if (result.success) {
      window.location.href = 'home.html';
    } else {
      alert('Login failed: ' + result.error);
    }
  });
}

// Initialize register page
function initializeRegisterPage() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    if (!fullName || !email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    const result = await registerUser(email, password, fullName);
    
    if (result.success) {
      alert('Registration successful! Please log in.');
      window.location.href = 'login.html';
    } else {
      alert('Registration failed: ' + result.error);
    }
  });
}

// Initialize home page
async function initializeHomePage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Add logout functionality to logout button
  const logoutBtn = document.querySelector('button:last-child');
  if (logoutBtn) {
    logoutBtn.onclick = logoutUser;
  }
}

// Initialize profile page
async function initializeProfilePage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Display user info
  const emailSpan = document.getElementById('userEmail');
  const userIdSpan = document.getElementById('userId');
  
  if (emailSpan) emailSpan.textContent = user.email;
  if (userIdSpan) userIdSpan.textContent = user.id;

  // Load user memories
  await loadUserMemories();
}

// Load user memories for profile page
async function loadUserMemories() {
  const result = await getUserMemories(currentUser.id);
  
  if (result.success) {
    displayUserMemories(result.data);
  } else {
    console.error('Failed to load user memories:', result.error);
  }
}

// Display user memories in profile
function displayUserMemories(memories) {
  const memoriesDiv = document.getElementById('memories');
  if (!memoriesDiv) return;

  if (memories.length === 0) {
    memoriesDiv.innerHTML = '<p>No memories yet. Go create some! 🌟</p>';
    return;
  }

  let html = '';
  memories.forEach(memory => {
    html += `
      <div class="memory">
        <p><strong>${memory.is_anonymous ? 'Anonymous' : 'You'}</strong></p>
        <p>${memory.text}</p>
        <p class="visibility">${memory.visibility.toUpperCase()}</p>
        <p style="font-size: 0.8rem; color: #666;">
          ${new Date(memory.created_at).toLocaleDateString()}
        </p>
        <button class="delete-btn" onclick="deleteUserMemory('${memory.id}')">Delete</button>
      </div>
    `;
  });
  
  memoriesDiv.innerHTML = html;
}

// Delete user memory
async function deleteUserMemory(memoryId) {
  if (!confirm('Are you sure you want to delete this memory?')) return;
  
  const result = await deleteMemory(memoryId, currentUser.id);
  
  if (result.success) {
    alert('Memory deleted successfully!');
    await loadUserMemories(); // Reload memories
  } else {
    alert('Failed to delete memory: ' + result.error);
  }
}

// Initialize memories list page
async function initializeMemoriesListPage() {
  try {
    // Get current location
    const location = await getCurrentLocation();
    
    // Load nearby memories
    const result = await getMemoriesNearLocation(location.lat, location.lng, 50);
    
    if (result.success) {
      displayMemoriesList(result.data);
    } else {
      console.error('Failed to load memories:', result.error);
    }
  } catch (error) {
    console.error('Initialize memories list error:', error);
  }
}

// Display memories in list format
function displayMemoriesList(memories) {
  const container = document.querySelector('.list-container');
  const h2 = container?.querySelector('h2');
  
  if (!container) return;

  // Update header
  if (h2) {
    h2.textContent = `📋 Found ${memories.length} memories within 50m`;
  }

  // Clear existing memory cards (but keep header and back link)
  const existingCards = container.querySelectorAll('.memory-card');
  existingCards.forEach(card => card.remove());

  if (memories.length === 0) {
    const noMemoriesDiv = document.createElement('div');
    noMemoriesDiv.className = 'memory-card';
    noMemoriesDiv.innerHTML = `
      <h4>🌟 No memories found</h4>
      <p>Be the first to leave a memory in this area!</p>
      <span>Start exploring and creating memories</span>
    `;
    container.insertBefore(noMemoriesDiv, container.lastElementChild);
    return;
  }

  memories.forEach(memory => {
    const displayName = memory.is_anonymous ? 'Anonymous' : 
                       (memory.profiles?.full_name || 'Unknown User');
    const visibilityIcon = memory.visibility === 'private' ? '🔒' : '🌸';
    const isOwner = currentUser && memory.user_id === currentUser.id;
    
    const memoryCard = document.createElement('div');
    memoryCard.className = 'memory-card';
    memoryCard.innerHTML = `
      <h4>${visibilityIcon} ${memory.visibility.charAt(0).toUpperCase() + memory.visibility.slice(1)} Memory</h4>
      <p>"${memory.text}"</p>
      <span>Posted by: ${isOwner ? 'You' : displayName} | ${new Date(memory.created_at).toLocaleDateString()}</span>
    `;
    
    container.insertBefore(memoryCard, container.lastElementChild);
  });
}

// ===== GLOBAL FUNCTIONS (for onclick handlers) =====
window.deleteUserMemory = deleteUserMemory;
window.logoutUser = logoutUser;

// ===== AUTO-INITIALIZATION =====

// Determine which page we're on and initialize accordingly
document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';

  // Initialize Supabase auth state listener
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
    }
  });

  // Page-specific initialization
  switch (filename) {
    case 'login.html':
      initializeLoginPage();
      break;
    case 'register.html':
      initializeRegisterPage();
      break;
    case 'home.html':
      await initializeHomePage();
      break;
    case 'profile.html':
      await initializeProfilePage();
      break;
    case 'post-memory-ar.html':
      await getCurrentLocation(); // Get location first
      initializePostMemoryAR();
      break;
    case 'see-memories-ar.html':
      await initializeViewMemoriesAR();
      break;
    case 'see-memories-list.html':
      await checkAuthState();
      await initializeMemoriesListPage();
      break;
    default:
      // For index.html or any other page, redirect to login
      if (filename === 'index.html' || filename === '') {
        window.location.href = 'login.html';
      }
  }
});

// ===== EXPORT FOR TESTING (if needed) =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentLocation,
    calculateDistance,
    registerUser,
    loginUser,
    logoutUser,
    saveMemory,
    getMemoriesNearLocation,
    getUserMemories,
    deleteMemory
  };
}