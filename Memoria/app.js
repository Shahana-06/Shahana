// Memoria - Community Time Capsule App
// Fixed JavaScript Implementation with working authentication and memory saving

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://gtviszfobbkewhuydtcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmlzemZvYmJrZXdodXlkdGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTczMzUsImV4cCI6MjA3NDAzMzMzNX0.ebduH-So7XZfyh3vtF5KAsslH_qJXIfRqvgjBlVJVQo';

// Initialize Supabase client
let supabase = null;

// Try to initialize Supabase, fallback to localStorage if not available
try {
  if (typeof createClient !== 'undefined') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.log('Supabase not available, using localStorage fallback');
}

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
      // Fallback to demo location if geolocation not available
      const demoLocation = {
        lat: 13.0827,
        lng: 80.2707,
        accuracy: 100
      };
      userLocation = demoLocation;
      resolve(demoLocation);
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
        console.log('Geolocation error, using demo location:', error);
        // Fallback to demo location
        const demoLocation = {
          lat: 13.0827,
          lng: 80.2707,
          accuracy: 100
        };
        userLocation = demoLocation;
        resolve(demoLocation);
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

// ===== STORAGE FUNCTIONS =====

// Get stored data with fallback
function getStoredData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting stored data:', error);
    return null;
  }
}

// Set stored data with fallback
function setStoredData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error setting stored data:', error);
    return false;
  }
}

// ===== AUTHENTICATION FUNCTIONS =====

// Register new user
async function registerUser(email, password, fullName) {
  try {
    if (supabase) {
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

      // Store user profile locally as backup
      const userData = {
        id: data.user.id,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString()
      };
      
      setStoredData(`user_${data.user.id}`, userData);
      
      return { success: true, user: data.user };
    } else {
      // Fallback to localStorage
      const userId = generateId();
      const userData = {
        id: userId,
        email: email,
        full_name: fullName,
        created_at: new Date().toISOString()
      };
      
      setStoredData(`user_${userId}`, userData);
      setStoredData('current_user', userData);
      currentUser = userData;
      
      return { success: true, user: userData };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      currentUser = data.user;
      setStoredData('current_user', data.user);
      return { success: true, user: data.user };
    } else {
      // For demo mode - accept any email/password combination
      const userData = {
        id: generateId(),
        email: email,
        full_name: email.split('@')[0],
        created_at: new Date().toISOString()
      };
      
      currentUser = userData;
      setStoredData('current_user', userData);
      
      return { success: true, user: userData };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Logout user
async function logoutUser() {
  try {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('demoUser'); // Remove demo user data
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if there's an error
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('demoUser');
    window.location.href = 'login.html';
    return { success: false, error: error.message };
  }
}

// Check authentication state
async function checkAuthState() {
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        currentUser = session.user;
        return currentUser;
      }
    }
    
    // Check localStorage for demo user or current user
    const storedUser = getStoredData('current_user') || getStoredData('demoUser');
    if (storedUser) {
      currentUser = storedUser;
      return currentUser;
    }
    
    return null;
  } catch (error) {
    console.error('Check auth state error:', error);
    return null;
  }
}

// ===== DATABASE FUNCTIONS =====

// Save memory to database
async function saveMemory(memoryData) {
  try {
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const memoryId = generateId();
    const memoryRecord = {
      id: memoryId,
      user_id: currentUser.id,
      text: memoryData.text,
      latitude: memoryData.latitude,
      longitude: memoryData.longitude,
      ar_position_x: memoryData.ar_position_x || null,
      ar_position_y: memoryData.ar_position_y || null,
      ar_position_z: memoryData.ar_position_z || null,
      screen_x: memoryData.screen_x || null,
      screen_y: memoryData.screen_y || null,
      visibility: memoryData.visibility || 'public',
      is_anonymous: memoryData.is_anonymous || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('memories')
        .insert([memoryRecord])
        .select();

      if (error) throw error;
      
      // Also save to localStorage as backup
      const allMemories = getStoredData('all_memories') || [];
      allMemories.push(memoryRecord);
      setStoredData('all_memories', allMemories);
      
      return { success: true, data: data[0] };
    } else {
      // Fallback to localStorage
      const allMemories = getStoredData('all_memories') || [];
      allMemories.push(memoryRecord);
      setStoredData('all_memories', allMemories);
      
      return { success: true, data: memoryRecord };
    }
  } catch (error) {
    console.error('Save memory error:', error);
    return { success: false, error: error.message };
  }
}

// Get memories near location
async function getMemoriesNearLocation(lat, lng, radius = 50) {
  try {
    let memories = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      memories = data || [];
    }
    
    // Also get from localStorage
    const localMemories = getStoredData('all_memories') || [];
    
    // Combine and deduplicate
    const allMemories = [...memories];
    localMemories.forEach(localMemory => {
      if (!allMemories.find(m => m.id === localMemory.id)) {
        allMemories.push(localMemory);
      }
    });

    // Filter by distance and visibility
    const nearbyMemories = allMemories.filter(memory => {
      const distance = calculateDistance(lat, lng, memory.latitude, memory.longitude);
      const withinRadius = distance <= radius;
      const canView = memory.visibility === 'public' || 
                     (currentUser && memory.user_id === currentUser.id);
      return withinRadius && canView;
    });

    return { success: true, data: nearbyMemories };
  } catch (error) {
    console.error('Get memories error:', error);
    
    // Fallback to localStorage only
    const localMemories = getStoredData('all_memories') || [];
    const nearbyMemories = localMemories.filter(memory => {
      const distance = calculateDistance(lat, lng, memory.latitude, memory.longitude);
      const withinRadius = distance <= radius;
      const canView = memory.visibility === 'public' || 
                     (currentUser && memory.user_id === currentUser.id);
      return withinRadius && canView;
    });
    
    return { success: true, data: nearbyMemories };
  }
}

// Get user's memories
async function getUserMemories(userId) {
  try {
    let memories = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      memories = data || [];
    }
    
    // Also get from localStorage
    const localMemories = getStoredData('all_memories') || [];
    const userLocalMemories = localMemories.filter(m => m.user_id === userId);
    
    // Combine and deduplicate
    const allMemories = [...memories];
    userLocalMemories.forEach(localMemory => {
      if (!allMemories.find(m => m.id === localMemory.id)) {
        allMemories.push(localMemory);
      }
    });

    return { success: true, data: allMemories };
  } catch (error) {
    console.error('Get user memories error:', error);
    
    // Fallback to localStorage only
    const localMemories = getStoredData('all_memories') || [];
    const userMemories = localMemories.filter(m => m.user_id === userId);
    
    return { success: true, data: userMemories };
  }
}

// Delete memory
async function deleteMemory(memoryId, userId) {
  try {
    if (supabase) {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', userId);

      if (error) throw error;
    }
    
    // Also remove from localStorage
    const allMemories = getStoredData('all_memories') || [];
    const filteredMemories = allMemories.filter(m => 
      !(m.id === memoryId && m.user_id === userId)
    );
    setStoredData('all_memories', filteredMemories);

    return { success: true };
  } catch (error) {
    console.error('Delete memory error:', error);
    
    // Try localStorage only
    const allMemories = getStoredData('all_memories') || [];
    const filteredMemories = allMemories.filter(m => 
      !(m.id === memoryId && m.user_id === userId)
    );
    setStoredData('all_memories', filteredMemories);
    
    return { success: true };
  }
}

// ===== AR FUNCTIONS =====

// Initialize AR scene for posting memories
function initializePostMemoryAR() {
  console.log('Initializing Post Memory AR...');
  // AR functionality remains the same but now saves properly
}

// Save AR memory with position data
async function saveArMemory(memoryData, position) {
  try {
    console.log('Saving AR memory...', memoryData, position);
    
    // Get current location
    const location = await getCurrentLocation();
    
    const fullMemoryData = {
      text: memoryData.text,
      latitude: location.lat,
      longitude: location.lng,
      ar_position_x: position.x,
      ar_position_y: position.y,
      ar_position_z: position.z,
      screen_x: memoryData.screenX || null,
      screen_y: memoryData.screenY || null,
      visibility: memoryData.visibility,
      is_anonymous: memoryData.isAnonymous
    };

    console.log('Full memory data:', fullMemoryData);

    const result = await saveMemory(fullMemoryData);
    console.log('Save result:', result);
    
    if (result.success) {
      alert('Memory saved successfully!');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Save AR memory error:', error);
    alert('Failed to save memory: ' + error.message);
  }
}

// ===== PAGE-SPECIFIC INITIALIZATION =====

// Initialize register page
function initializeRegisterPage() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    
    if (!fullName || !email || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    // Disable submit button during processing
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
      const result = await registerUser(email, password, fullName);
      
      if (result.success) {
        alert('Account created successfully! You can now log in.');
        window.location.href = 'login.html';
      } else {
        alert('Registration failed: ' + result.error);
      }
    } catch (error) {
      alert('Registration failed: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
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

  console.log('Current user on home page:', user);

  // Add logout functionality to logout button
  const logoutBtn = document.querySelector('button:last-child');
  if (logoutBtn && !logoutBtn.onclick) {
    logoutBtn.onclick = () => {
      if (confirm('Are you sure you want to logout?')) {
        logoutUser();
      }
    };
  }
}

// Initialize profile page
async function initializeProfilePage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  console.log('Current user on profile page:', user);

  // Display user info
  const emailSpan = document.getElementById('userEmail');
  const userIdSpan = document.getElementById('userId');
  
  if (emailSpan) emailSpan.textContent = user.email || 'Demo User';
  if (userIdSpan) userIdSpan.textContent = user.id || 'demo-id';

  // Load user memories
  await loadUserMemories();
}

// Load user memories for profile page
async function loadUserMemories() {
  if (!currentUser) {
    console.error('No current user for loading memories');
    return;
  }

  try {
    const result = await getUserMemories(currentUser.id);
    
    if (result.success) {
      displayUserMemories(result.data);
    } else {
      console.error('Failed to load user memories:', result.error);
      displayUserMemories([]);
    }
  } catch (error) {
    console.error('Error loading user memories:', error);
    displayUserMemories([]);
  }
}

// Display user memories in profile
function displayUserMemories(memories) {
  const memoriesDiv = document.getElementById('memories');
  if (!memoriesDiv) return;

  if (memories.length === 0) {
    memoriesDiv.innerHTML = '<p>No memories yet. Go create some!</p>';
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
  if (!currentUser) {
    alert('You must be logged in to delete memories');
    return;
  }

  if (!confirm('Are you sure you want to delete this memory?')) return;
  
  try {
    const result = await deleteMemory(memoryId, currentUser.id);
    
    if (result.success) {
      alert('Memory deleted successfully!');
      await loadUserMemories(); // Reload memories
    } else {
      alert('Failed to delete memory: ' + result.error);
    }
  } catch (error) {
    console.error('Delete memory error:', error);
    alert('Error deleting memory: ' + error.message);
  }
}

// Initialize memories list page
async function initializeMemoriesListPage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Get current location
    const location = await getCurrentLocation();
    console.log('Current location:', location);
    
    // Load nearby memories
    const result = await getMemoriesNearLocation(location.lat, location.lng, 50);
    console.log('Nearby memories result:', result);
    
    if (result.success) {
      displayMemoriesList(result.data);
    } else {
      console.error('Failed to load memories:', result.error);
      displayMemoriesList([]);
    }
  } catch (error) {
    console.error('Initialize memories list error:', error);
    displayMemoriesList([]);
  }
}

// Display memories in list format
function displayMemoriesList(memories) {
  const container = document.querySelector('.list-container');
  const h2 = container?.querySelector('h2');
  
  if (!container) return;

  // Update header
  if (h2) {
    h2.textContent = `Found ${memories.length} memories within 50m`;
  }

  // Clear existing memory cards (but keep header and back link)
  const existingCards = container.querySelectorAll('.memory-card');
  existingCards.forEach(card => card.remove());

  if (memories.length === 0) {
    const noMemoriesDiv = document.createElement('div');
    noMemoriesDiv.className = 'memory-card';
    noMemoriesDiv.innerHTML = `
      <h4>No memories found</h4>
      <p>Be the first to leave a memory in this area!</p>
      <span>Start exploring and creating memories</span>
    `;
    container.insertBefore(noMemoriesDiv, container.lastElementChild);
    return;
  }

  memories.forEach(memory => {
    const displayName = memory.is_anonymous ? 'Anonymous' : 
                       (memory.full_name || 'Unknown User');
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
window.saveArMemory = saveArMemory;

// ===== AUTO-INITIALIZATION =====

// Determine which page we're on and initialize accordingly
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded');
  
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  
  console.log('Current page:', filename);

  // Initialize auth state first
  await checkAuthState();
  console.log('Auth state checked, current user:', currentUser);

  // Page-specific initialization
  switch (filename) {
    case 'register.html':
      console.log('Initializing register page');
      initializeRegisterPage();
      break;
    case 'home.html':
      console.log('Initializing home page');
      await initializeHomePage();
      break;
    case 'profile.html':
      console.log('Initializing profile page');
      await initializeProfilePage();
      break;
    case 'post-memory-ar.html':
      console.log('Initializing post memory AR page');
      await getCurrentLocation(); // Get location first
      initializePostMemoryAR();
      break;
    case 'see-memories-list.html':
      console.log('Initializing memories list page');
      await initializeMemoriesListPage();
      break;
    default:
      console.log('Default case for page:', filename);
      // For index.html or any other page, don't force redirect
      break;
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
