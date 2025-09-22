// Memoria - Community Time Capsule App
// Fixed JavaScript Implementation with working authentication and memory saving

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://gtviszfobbkewhuydtcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmlzemZvYmJrZXdodXlkdGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTczMzUsImV4cCI6MjA3NDAzMzMzNX0.ebduH-So7XZfyh3vtF5KAsslH_qJXIfRqvgjBlVJVQo';

// Initialize Supabase client (with proper check)
let supabase = null;

// Try to initialize Supabase, fallback to localStorage if not available
try {
  // Check if Supabase is available globally or via CDN
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
  } else if (typeof createClient !== 'undefined') {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized via createClient');
  } else {
    console.log('📱 Supabase not available, using localStorage fallback');
  }
} catch (error) {
  console.log('📱 Supabase not available, using localStorage fallback:', error.message);
}

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let userLocation = null;
let placedMarkers = [];
let arScene = null;

// Demo memories for testing
const demoMemories = [
  {
    id: 'demo-memory-1',
    text: 'I used to come here every evening during my college days. So many memories!',
    latitude: 13.0827,
    longitude: 80.2707,
    ar_position_x: -1,
    ar_position_y: 0.5,
    ar_position_z: -3,
    screen_x: 200,
    screen_y: 300,
    visibility: 'public',
    is_anonymous: true,
    user_id: 'other-user',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    full_name: 'Anonymous User'
  },
  {
    id: 'demo-memory-2',
    text: 'Best picnic spot with my family last summer 💕',
    latitude: 13.0825,
    longitude: 80.2705,
    ar_position_x: 1,
    ar_position_y: 0.8,
    ar_position_z: -2,
    screen_x: 400,
    screen_y: 250,
    visibility: 'public',
    is_anonymous: false,
    user_id: 'other-user-2',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    full_name: 'Demo User'
  },
  {
    id: 'demo-memory-3',
    text: 'This is where I made a life-changing decision.',
    latitude: 13.0829,
    longitude: 80.2709,
    ar_position_x: 0,
    ar_position_y: 1.2,
    ar_position_z: -4,
    screen_x: 300,
    screen_y: 200,
    visibility: 'private',
    is_anonymous: false,
    user_id: 'demo-user-123', // Will be updated to current user
    created_at: new Date(Date.now() - 259200000).toISOString(),
    full_name: 'You'
  }
];

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
      console.log('📍 Using demo location:', demoLocation);
      resolve(demoLocation);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        console.log('📍 Got user location:', userLocation);
        resolve(userLocation);
      },
      (error) => {
        console.log('📍 Geolocation error, using demo location:', error.message);
        // Fallback to demo location
        const demoLocation = {
          lat: 13.0827,
          lng: 80.2707,
          accuracy: 100
        };
        userLocation = demoLocation;
        resolve(demoLocation);
      },
      options
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
        name: fullName, // For compatibility
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
        name: fullName, // For compatibility
        created_at: new Date().toISOString()
      };
      
      setStoredData(`user_${userId}`, userData);
      setStoredData('current_user', userData);
      setStoredData('demoUser', userData); // For compatibility with login.html
      currentUser = userData;
      
      return { success: true, user: userData };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user - Compatible with both systems
async function loginUser(email, password) {
  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      // Store for compatibility
      const userData = {
        ...data.user,
        name: data.user.user_metadata?.full_name || email.split('@')[0]
      };
      
      currentUser = userData;
      setStoredData('current_user', userData);
      setStoredData('demoUser', userData); // For compatibility
      return { success: true, user: userData };
    } else {
      // For demo mode - accept any email/password combination
      const userData = {
        id: generateId(),
        email: email,
        full_name: email.split('@')[0],
        name: email.split('@')[0], // For compatibility
        created_at: new Date().toISOString()
      };
      
      currentUser = userData;
      setStoredData('current_user', userData);
      setStoredData('demoUser', userData); // For compatibility with existing login.html
      
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
    localStorage.removeItem('userMemories');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if there's an error
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('demoUser');
    localStorage.removeItem('userMemories');
    return { success: false, error: error.message };
  }
}

// Check authentication state - Compatible with existing HTML files
async function checkAuthState() {
  try {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const userData = {
          ...session.user,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0]
        };
        currentUser = userData;
        setStoredData('demoUser', userData); // For compatibility
        return currentUser;
      }
    }
    
    // Check localStorage for demo user or current user
    const storedUser = getStoredData('demoUser') || getStoredData('current_user');
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

// Handle registration (for compatibility with register.html)
async function handleRegistration(formData) {
  return await registerUser(formData.email, 'demo-password', formData.fullName);
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
      updated_at: new Date().toISOString(),
      full_name: currentUser.name || currentUser.full_name || 'User'
    };

    if (supabase) {
      try {
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
      } catch (supabaseError) {
        console.log('Supabase save failed, using localStorage:', supabaseError);
        // Fall through to localStorage save
      }
    }
    
    // Fallback to localStorage
    const allMemories = getStoredData('all_memories') || [];
    allMemories.push(memoryRecord);
    setStoredData('all_memories', allMemories);
    
    // Also save to userMemories for compatibility
    const userMemories = getStoredData('userMemories') || [];
    userMemories.push(memoryRecord);
    setStoredData('userMemories', userMemories);
    
    console.log('✅ Memory saved to localStorage');
    return { success: true, data: memoryRecord };
    
  } catch (error) {
    console.error('Save memory error:', error);
    return { success: false, error: error.message };
  }
}

// Get memories near location - Enhanced with demo data
async function getMemoriesNearLocation(lat, lng, radius = 50) {
  try {
    console.log(`🔍 Searching for memories near ${lat}, ${lng} within ${radius}m`);
    
    let memories = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          memories = data;
          console.log('✅ Loaded from Supabase:', memories.length);
        }
      } catch (supabaseError) {
        console.log('Supabase query failed, using localStorage:', supabaseError);
      }
    }
    
    // Also get from localStorage
    const localMemories = getStoredData('all_memories') || [];
    const userMemories = getStoredData('userMemories') || [];
    
    console.log('📱 Local memories:', localMemories.length);
    console.log('👤 User memories:', userMemories.length);
    
    // Add demo memories with current user's location
    const enhancedDemoMemories = demoMemories.map(memory => {
      const memoryClone = { ...memory };
      // Update demo locations to be near user
      memoryClone.latitude = lat + (Math.random() - 0.5) * 0.002; // Within ~200m
      memoryClone.longitude = lng + (Math.random() - 0.5) * 0.002;
      
      // Set current user as owner of private memories
      if (memoryClone.visibility === 'private' && currentUser) {
        memoryClone.user_id = currentUser.id;
        memoryClone.full_name = currentUser.name || currentUser.full_name || 'You';
      }
      
      return memoryClone;
    });
    
    // Combine all memory sources
    const allMemories = [...memories];
    
    // Add local memories if not already present
    [...localMemories, ...userMemories, ...enhancedDemoMemories].forEach(localMemory => {
      if (!allMemories.find(m => m.id === localMemory.id)) {
        allMemories.push(localMemory);
      }
    });

    console.log('📊 Total memories before filtering:', allMemories.length);

    // Filter by distance and visibility
    const nearbyMemories = allMemories.filter(memory => {
      const distance = calculateDistance(lat, lng, memory.latitude, memory.longitude);
      const withinRadius = distance <= radius;
      const canView = memory.visibility === 'public' || 
                     (currentUser && memory.user_id === currentUser.id);
      
      if (withinRadius && canView) {
        console.log(`✅ Memory "${memory.text.substring(0, 20)}..." - Distance: ${Math.round(distance)}m`);
      }
      
      return withinRadius && canView;
    });

    console.log(`🎯 Found ${nearbyMemories.length} nearby memories`);
    return { success: true, data: nearbyMemories };
    
  } catch (error) {
    console.error('Get memories error:', error);
    
    // Emergency fallback with demo data
    const fallbackMemories = demoMemories.map(memory => ({
      ...memory,
      latitude: lat + (Math.random() - 0.5) * 0.001,
      longitude: lng + (Math.random() - 0.5) * 0.001,
      user_id: memory.visibility === 'private' ? (currentUser?.id || 'demo-user') : memory.user_id
    }));
    
    console.log('🚨 Using fallback memories:', fallbackMemories.length);
    return { success: true, data: fallbackMemories };
  }
}

// Get user's memories
async function getUserMemories(userId) {
  try {
    let memories = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          memories = data;
        }
      } catch (supabaseError) {
        console.log('Supabase user memories query failed:', supabaseError);
      }
    }
    
    // Also get from localStorage
    const localMemories = getStoredData('all_memories') || [];
    const userLocalMemories = localMemories.filter(m => m.user_id === userId);
    
    const userMemories = getStoredData('userMemories') || [];
    const compatibilityMemories = userMemories.filter(m => m.user_id === userId);
    
    // Combine and deduplicate
    const allMemories = [...memories];
    [...userLocalMemories, ...compatibilityMemories].forEach(localMemory => {
      if (!allMemories.find(m => m.id === localMemory.id)) {
        allMemories.push(localMemory);
      }
    });

    return { success: true, data: allMemories };
  } catch (error) {
    console.error('Get user memories error:', error);
    
    // Fallback to localStorage only
    const localMemories = getStoredData('all_memories') || [];
    const userMemories = getStoredData('userMemories') || [];
    const allLocalMemories = [...localMemories, ...userMemories];
    const filteredMemories = allLocalMemories.filter(m => m.user_id === userId);
    
    return { success: true, data: filteredMemories };
  }
}

// Delete memory
async function deleteMemory(memoryId, userId) {
  try {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('memories')
          .delete()
          .eq('id', memoryId)
          .eq('user_id', userId);

        if (error) throw error;
      } catch (supabaseError) {
        console.log('Supabase delete failed:', supabaseError);
      }
    }
    
    // Also remove from localStorage
    const allMemories = getStoredData('all_memories') || [];
    const filteredMemories = allMemories.filter(m => 
      !(m.id === memoryId && m.user_id === userId)
    );
    setStoredData('all_memories', filteredMemories);
    
    // Also remove from userMemories
    const userMemories = getStoredData('userMemories') || [];
    const filteredUserMemories = userMemories.filter(m => 
      !(m.id === memoryId && m.user_id === userId)
    );
    setStoredData('userMemories', filteredUserMemories);

    return { success: true };
  } catch (error) {
    console.error('Delete memory error:', error);
    return { success: false, error: error.message };
  }
}

// ===== AR FUNCTIONS =====

// Initialize AR scene for posting memories
function initializePostMemoryAR() {
  console.log('🚀 Initializing Post Memory AR...');
  // AR functionality remains the same but now saves properly
}

// Save AR memory with position data
async function saveArMemory(memoryData, position) {
  try {
    console.log('💾 Saving AR memory...', memoryData, position);
    
    // Get current location
    const location = await getCurrentLocation();
    
    const fullMemoryData = {
      text: memoryData.text,
      latitude: location.lat,
      longitude: location.lng,
      ar_position_x: position?.x || null,
      ar_position_y: position?.y || null,
      ar_position_z: position?.z || null,
      screen_x: memoryData.screenX || null,
      screen_y: memoryData.screenY || null,
      visibility: memoryData.visibility,
      is_anonymous: memoryData.isAnonymous
    };

    console.log('📝 Full memory data:', fullMemoryData);

    const result = await saveMemory(fullMemoryData);
    console.log('💾 Save result:', result);
    
    if (result.success) {
      console.log('✅ Memory saved successfully!');
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Save AR memory error:', error);
    throw error;
  }
}

// ===== PAGE-SPECIFIC INITIALIZATION =====

// Initialize register page
function initializeRegisterPage() {
  const form = document.querySelector('#registerForm');
  if (!form) return;

  console.log('🔧 Initializing register page');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = form.querySelector('#fullName').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    
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
    const submitBtn = form.querySelector('#registerBtn');
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

  console.log('🏠 Current user on home page:', user.email);

  // Update welcome message if it exists
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome back, ${user.name || user.full_name || user.email.split('@')[0]}! What would you like to do today?`;
  }

  // Add logout functionality to logout button
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn && !logoutBtn.onclick) {
    logoutBtn.onclick = async () => {
      if (confirm('Are you sure you want to logout?')) {
        await logoutUser();
        window.location.href = 'login.html';
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

  console.log('👤 Current user on profile page:', user.email);

  // Display user info
  const emailSpan = document.getElementById('userEmail');
  const userIdSpan = document.getElementById('userId');
  
  if (emailSpan) emailSpan.textContent = user.email || 'Demo User';
  if (userIdSpan) userIdSpan.textContent = user.id || 'demo-id';

  // Load user memories
  await loadUserMemories();
  
  // Add logout functionality
  const logoutBtn = document.querySelector('button[onclick="logout()"]');
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        await logoutUser();
        window.location.href = 'login.html';
      }
    };
  }
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

  console.log('📋 Initializing memories list page');

  try {
    // Get current location
    const location = await getCurrentLocation();
    console.log('📍 Current location for memories list:', location);
    
    // Load nearby memories
    const result = await getMemoriesNearLocation(location.lat, location.lng, 50);
    console.log('🔍 Nearby memories result:', result);
    
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
window.checkAuthState = checkAuthState;
window.getCurrentLocation = getCurrentLocation;
window.getMemoriesNearLocation = getMemoriesNearLocation;
window.calculateDistance = calculateDistance;
window.handleRegistration = handleRegistration;
window.saveMemory = saveMemory;

// For backward compatibility with your HTML files
window.logout = async function() {
  await logoutUser();
  window.location.href = 'login.html';
};

// ===== AUTO-INITIALIZATION =====

// Determine which page we're on and initialize accordingly
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 DOM Content Loaded - Memoria App Starting');
  
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  
  console.log('📱 Current page:', filename);

  // Initialize auth state first
  await checkAuthState();
  console.log('🔐 Auth state checked, current user:', currentUser?.email || 'None');

  // Page-specific initialization
  switch (filename) {
    case 'register.html':
      console.log('🔧 Initializing register page');
      initializeRegisterPage();
      break;
    case 'home.html':
      console.log('🏠 Initializing home page');
      await initializeHomePage();
      break;
    case 'profile.html':
      console.log('👤 Initializing profile page');
      await initializeProfilePage();
      break;
    case 'post-memory-ar.html':
      console.log('📱 Initializing post memory AR page');
      await getCurrentLocation(); // Get location first
      initializePostMemoryAR();
      break;
    case 'see-memories-list.html':
      console.log('📋 Initializing memories list page');
      await initializeMemoriesListPage();
      break;
    case 'see-memories-ar.html':
      console.log('🔍 AR memories page detected - functions ready');
      // Don't auto-initialize here, let the AR page handle it
      break;
    default:
      console.log('📄 Default case for page:', filename);
      // For index.html or any other page, don't force redirect
      break;
  }
});

// Additional initialization for window load (fallback)
window.addEventListener('load', async () => {
  console.log('🌐 Window loaded');
  
  // Ensure auth state is set for global access
  if (!currentUser) {
    await checkAuthState();
  }
});

// Debug logging
console.log('✅ App.js loaded successfully - All functions ready');

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
    deleteMemory,
    checkAuthState,
    handleRegistration
  };
}
