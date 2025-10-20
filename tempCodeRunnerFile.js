// Simple SPA logic with vanilla JS + Leaflet for map
// const loginBtn = document.getElementById('loginBtn');
// const registerBtn = document.getElementById('registerBtn');
// const logoutBtn = document.getElementById('logoutBtn');
// const roleBadge = document.getElementById('roleBadge');
// const brokerPanel = document.getElementById('brokerPanel');

// const loginModal = document.getElementById('loginModal');
// const registerModal = document.getElementById('registerModal');
// const loginForm = document.getElementById('loginForm');
// const registerForm = document.getElementById('registerForm');
// const searchForm = document.getElementById('searchForm');
// const listingForm = document.getElementById('listingForm');

// const resultsDiv = document.getElementById('results');
// const searchStatus = document.getElementById('searchStatus');
// const listingStatus = document.getElementById('listingStatus');

// let token = localStorage.getItem('token') || null;
// let role = localStorage.getItem('role') || null;

// function setAuthUI(){
//   if(token){
//     logoutBtn.classList.remove('hidden');
//     roleBadge.classList.remove('hidden');
//     roleBadge.textContent = role?.toUpperCase() || '';
//     loginBtn.classList.add('hidden');
//     registerBtn.classList.add('hidden');
//     if(role === 'broker'){
//       brokerPanel.classList.remove('hidden');
//     }else{
//       brokerPanel.classList.add('hidden');
//     }
//   }else{
//     logoutBtn.classList.add('hidden');
//     roleBadge.classList.add('hidden');
//     loginBtn.classList.remove('hidden');
//     registerBtn.classList.remove('hidden');
//     brokerPanel.classList.add('hidden');
//   }
// }

// loginBtn.onclick = ()=> loginModal.showModal();
// registerBtn.onclick = ()=> registerModal.showModal();
// logoutBtn.onclick = ()=>{
//   token = null; role = null;
//   localStorage.removeItem('token');
//   localStorage.removeItem('role');
//   setAuthUI();
// };

// loginForm.onsubmit = async (e)=>{
//   e.preventDefault();
//   const fd = new FormData(loginForm);
//   const payload = Object.fromEntries(fd.entries());
//   try{
//     const res = await fetch(`${window.API_BASE}/auth/login`,{
//       method:'POST', headers:{'Content-Type':'application/json'},
//       body: JSON.stringify(payload)
//     });
//     const data = await res.json();
//     if(!res.ok) throw new Error(data.detail || 'Login failed');
//     token = data.access_token;
//     role = data.role;
//     localStorage.setItem('token', token);
//     localStorage.setItem('role', role);
//     loginModal.close();
//     setAuthUI();
//   }catch(err){
//     alert(err.message);
//   }
// };

// registerForm.onsubmit = async (e)=>{
//   e.preventDefault();
//   const fd = new FormData(registerForm);
//   const payload = Object.fromEntries(fd.entries());
//   try{
//     const res = await fetch(`${window.API_BASE}/auth/register`,{
//       method:'POST', headers:{'Content-Type':'application/json'},
//       body: JSON.stringify(payload)
//     });
//     const data = await res.json();
//     if(!res.ok) throw new Error(data.detail || 'Registration failed');
//     registerModal.close();
//     alert('Account created. Please login.');
//   }catch(err){
//     alert(err.message);
//   }
// };

// // Map
// let map = L.map('map').setView([12.9165,79.1325], 12);
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '© OpenStreetMap contributors'
// }).addTo(map);
// let markersLayer = L.layerGroup().addTo(map);

// function renderResults(items){
//   resultsDiv.innerHTML = '';
//   markersLayer.clearLayers();
//   if(!items.length){
//     resultsDiv.innerHTML = '<p class="muted">No results</p>';
//     return;
//   }
//   items.forEach(item=>{
//     const card = document.createElement('div');
//     card.className = 'card';
//     card.innerHTML = `
//       <h4>${item.title} — ₹${item.price.toLocaleString('en-IN')}</h4>
//       <div class="muted">${item.property_type} • ${item.location}</div>
//       <div>Score: <strong>${item.score?.toFixed?.(2) ?? '-'}</strong></div>
//       <p>${item.description || ''}</p>
//       <div class="muted">Amenities: ${(item.amenities||[]).join(', ') || '-'}</div>
//       <div class="muted">Community: ${(item.community_tags||[]).join(', ') || '-'}</div>
//     `;
//     resultsDiv.appendChild(card);
//     if(item.lat && item.lng){
//       const m = L.marker([item.lat, item.lng]).addTo(markersLayer);
//       m.bindPopup(`<b>${item.title}</b><br/>₹${item.price.toLocaleString('en-IN')}<br/>${item.location}`);
//     }
//   });
// }

// searchForm.onsubmit = async (e)=>{
//   e.preventDefault();
//   searchStatus.textContent = 'Searching...';
//   const fd = new FormData(searchForm);
//   const params = new URLSearchParams();
//   for(const [k,v] of fd.entries()){
//     if(k==='amenities' || k==='community_tags') continue;
//     if(v) params.append(k, v);
//   }
//   const amenities = fd.getAll('amenities');
//   const community = fd.getAll('community_tags');
//   if(amenities.length) params.append('amenities', amenities.join(','));
//   if(community.length) params.append('community_tags', community.join(','));

//   try{
//     const res = await fetch(`${window.API_BASE}/listings?${params.toString()}`);
//     const data = await res.json();
//     if(!res.ok) throw new Error(data.detail || 'Search failed');
//     renderResults(data);
//   }catch(err){
//     alert(err.message);
//   }finally{
//     searchStatus.textContent='';
//   }
// };

// listingForm?.addEventListener('submit', async (e)=>{
//   e.preventDefault();
//   listingStatus.textContent = 'Saving...';
//   const fd = new FormData(listingForm);
//   const payload = {
//     title: fd.get('title'),
//     location: fd.get('location'),
//     lat: fd.get('lat') ? parseFloat(fd.get('lat')) : null,
//     lng: fd.get('lng') ? parseFloat(fd.get('lng')) : null,
//     property_type: fd.get('property_type'),
//     price: parseInt(fd.get('price'),10),
//     description: fd.get('description'),
//     amenities: fd.getAll('amenities'),
//     community_tags: fd.getAll('community_tags')
//   };
//   try{
//     const res = await fetch(`${window.API_BASE}/listings`,{
//       method:'POST',
//       headers:{
//         'Content-Type':'application/json',
//         ...(token ? {'Authorization':`Bearer ${token}`} : {})
//       },
//       body: JSON.stringify(payload)
//     });
//     const data = await res.json();
//     if(!res.ok) throw new Error(data.detail || 'Save failed');
//     listingForm.reset();
//     alert('Listing saved!');
//   }catch(err){
//     alert(err.message);
//   }finally{
//     listingStatus.textContent='';
//   }
// });

// // initial load
// setAuthUI();
// searchForm.dispatchEvent(new Event('submit'));
