// Complete app.js with Supabase integration - FIXED VERSION
// Initialize Supabase (replace with your actual credentials)
const SUPABASE_URL = 'https://gtviszfobbkewhuydtcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0dmlzemZvYmJrZXdodXlkdGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTczMzUsImV4cCI6MjA3NDAzMzMzNX0.ebduH-So7XZfyh3vtF5KAsslH_qJXIfRqvgjBlVJVQo';

// Initialize Supabase client - FIXED: Remove circular reference
let supabaseClient;
try {
  // Check if Supabase is available globally
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️ Supabase not available, using demo mode');
  }
} catch (error) {
  console.log('⚠️ Supabase not available, using demo mode:', error);
}

// Global variables
let currentUser = null;

// ===== AUTHENTICATION FUNCTIONS =====

async function checkAuthState() {
  console.log('Checking auth state...');
  
  try {
    if (supabaseClient) {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        return null;
      }
      currentUser = user;
      return user;
    } else {
      // Demo mode - check localStorage
      const demoUser = localStorage.getItem('demoUser');
      if (demoUser) {
        currentUser = JSON.parse(demoUser);
        return currentUser;
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  
  return null;
}

async function loginUser(email, password) {
  console.log('Attempting login for:', email);
  
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
      
      currentUser = data.user;
      return { success: true, user: data.user };
    } else {
      // Demo mode
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: email.split('@')[0]
      };
      
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      currentUser = demoUser;
      return { success: true, user: demoUser };
    }
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: error.message };
  }
}

async function registerUser(email, password, fullName) {
  console.log('Attempting registration for:', email);
  
  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, user: data.user };
    } else {
      // Demo mode
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: fullName,
        full_name: fullName
      };
      
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      currentUser = demoUser;
      return { success: true, user: demoUser };
    }
  } catch (error) {
    console.error('Registration failed:', error);
    return { success: false, error: error.message };
  }
}

async function logoutUser() {
  try {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('demoUser');
    currentUser = null;
    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    return { success: false, error: error.message };
  }
}

// ===== LOCATION FUNCTIONS =====

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Provide default location if geolocation fails
        resolve({
          lat: 13.0827, // Chennai coordinates as fallback
          lng: 80.2707,
          accuracy: 1000
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// ===== MEMORY FUNCTIONS =====

async function saveMemory(memoryData) {
  console.log('Saving memory:', memoryData);
  
  try {
    const user = await checkAuthState();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const memoryRecord = {
      user_id: user.id,
      text: memoryData.text,
      latitude: memoryData.latitude,
      longitude: memoryData.longitude,
      ar_position_x: memoryData.ar_position_x,
      ar_position_y: memoryData.ar_position_y,
      ar_position_z: memoryData.ar_position_z,
      screen_x: memoryData.screen_x,
      screen_y: memoryData.screen_y,
      visibility: memoryData.visibility,
      is_anonymous: memoryData.is_anonymous,
      created_at: new Date().toISOString()
    };
    
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('memories')
        .insert([memoryRecord])
        .select()
        .single();
        
      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to save memory: ' + error.message);
      }
      
      console.log('✅ Memory saved to database:', data);
      return { success: true, data: data };
    } else {
      // Demo mode - save to localStorage
      const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
      memoryRecord.id = 'memory-' + Date.now();
      memories.push(memoryRecord);
      localStorage.setItem('demo_memories', JSON.stringify(memories));
      
      console.log('✅ Memory saved to demo storage:', memoryRecord);
      return { success: true, data: memoryRecord };
    }
  } catch (error) {
    console.error('❌ Failed to save memory:', error);
    return { success: false, error: error.message };
  }
}

async function getMemoriesNearLocation(latitude, longitude, radiusMeters = 50) {
  console.log(`Getting memories near ${latitude}, ${longitude} within ${radiusMeters}m`);
  
  try {
    const user = await checkAuthState();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    let memories = [];
    
    if (supabaseClient) {
      // Get all public memories first (basic query without PostGIS)
      const { data: publicMemories, error: publicError } = await supabaseClient
        .from('memories')
        .select('*')
        .eq('visibility', 'public');
        
      if (publicError) {
        throw new Error('Failed to fetch public memories: ' + publicError.message);
      }
      
      // Get user's own memories
      const { data: userMemories, error: userError } = await supabaseClient
        .from('memories')
        .select('*')
        .eq('user_id', user.id);
        
      if (userError) {
        throw new Error('Failed to fetch user memories: ' + userError.message);
      }
      
      // Combine and filter by distance on client side
      const allMemories = [...(publicMemories || []), ...(userMemories || [])];
      
      // Remove duplicates and filter by distance
      const uniqueMemories = allMemories.filter((memory, index, self) => 
        index === self.findIndex(m => m.id === memory.id)
      );
      
      memories = uniqueMemories.filter(memory => {
        const distance = calculateDistance(
          latitude, longitude,
          memory.latitude, memory.longitude
        );
        return distance <= radiusMeters;
      });
      
    } else {
      // Demo mode
      let demoMemories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
      
      // Add some sample memories if none exist
      if (demoMemories.length === 0) {
        const sampleMemories = [
          {
            id: 'sample-1',
            user_id: 'sample-user',
            text: 'Beautiful sunset from this spot last evening! The colors were absolutely magical and reminded me of childhood summers.',
            latitude: latitude + 0.0001,
            longitude: longitude + 0.0001,
            ar_position_x: 0.5,
            ar_position_y: 0,
            ar_position_z: -2,
            visibility: 'public',
            is_anonymous: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            user_id: 'sample-user-2',
            text: 'Had amazing coffee here with friends! This place holds so many precious memories of laughter and deep conversations.',
            latitude: latitude - 0.0001,
            longitude: longitude - 0.0001,
            ar_position_x: -0.5,
            ar_position_y: 0,
            ar_position_z: -3,
            visibility: 'public',
            is_anonymous: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-3',
            user_id: user.id,
            text: 'This is my secret thinking spot. I come here whenever I need clarity and peace.',
            latitude: latitude + 0.00005,
            longitude: longitude - 0.00005,
            ar_position_x: 0.2,
            ar_position_y: 0.1,
            ar_position_z: -2.5,
            visibility: 'private',
            is_anonymous: false,
            created_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('demo_memories', JSON.stringify(sampleMemories));
        demoMemories = sampleMemories;
      }
      
      // Filter demo memories by distance
      memories = demoMemories.filter(memory => {
        const distance = calculateDistance(
          latitude, longitude,
          memory.latitude, memory.longitude
        );
        return distance <= radiusMeters;
      });
    }
    
    console.log(`✅ Found ${memories.length} memories near location`);
    return { success: true, data: memories };
  } catch (error) {
    console.error('❌ Failed to get memories:', error);
    return { success: false, error: error.message };
  }
}

// ===== PAGE INITIALIZATION FUNCTIONS =====

async function initializeHomePage() {
  console.log('Initializing home page...');
  
  try {
    const user = await checkAuthState();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) {
      const displayName = user.name || user.full_name || user.email?.split('@')[0] || 'User';
      welcomeMsg.textContent = `Welcome back, ${displayName}!`;
    }
    
    // Setup logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const result = await logoutUser();
        if (result.success) {
          window.location.href = 'login.html';
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to initialize home page:', error);
    window.location.href = 'login.html';
  }
}

// ===== FORM HANDLERS =====

// Setup form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up form handlers...');
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        showError('Please fill in all fields');
        return;
      }
      
      const result = await loginUser(email, password);
      if (result.success) {
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1000);
      } else {
        showError(result.error || 'Login failed');
      }
    });
  }
  
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!fullName || !email || !password) {
        showError('Please fill in all fields');
        return;
      }
      
      if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }
      
      const result = await registerUser(email, password, fullName);
      if (result.success) {
        showSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1000);
      } else {
        showError(result.error || 'Registration failed');
      }
    });
  }
});

// ===== UTILITY FUNCTIONS =====

function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  }
  if (successMsg) {
    successMsg.style.display = 'none';
  }
  
  console.error('Error:', message);
}

function showSuccess(message) {
  const successMsg = document.getElementById('successMsg');
  const errorMsg = document.getElementById('errorMsg');
  
  if (successMsg) {
    successMsg.textContent = message;
    successMsg.style.display = 'block';
  }
  if (errorMsg) {
    errorMsg.style.display = 'none';
  }
  
  console.log('Success:', message);
}

// Quick demo login function (for login page)
window.quickLogin = () => {
  document.getElementById('email').value = 'demo@memoria.com';
  document.getElementById('password').value = 'demo123';
  document.getElementById('loginForm').dispatchEvent(new Event('submit'));
};

// Export functions for global access
window.checkAuthState = checkAuthState;
window.getCurrentLocation = getCurrentLocation;
window.calculateDistance = calculateDistance;
window.saveMemory = saveMemory;
window.getMemoriesNearLocation = getMemoriesNearLocation;
window.initializeHomePage = initializeHomePage;
