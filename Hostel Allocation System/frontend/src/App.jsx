import React, { useState } from 'react';
import { Upload, Play, Download, Users, Home, BarChart3, FileText, CheckCircle, Info } from 'lucide-react';

// Sample data generator with room priorities and mandatory roommates
const generateSampleData = () => {
  const names = ['Aarav Kumar', 'Diya Sharma', 'Arjun Patel', 'Ananya Singh', 'Rohan Gupta', 
                 'Ishita Reddy', 'Kabir Mehta', 'Saanvi Joshi', 'Vihaan Nair', 'Aanya Desai',
                 'Advait Shah', 'Myra Iyer', 'Reyansh Menon', 'Kiara Malhotra', 'Ayaan Kapoor',
                 'Navya Rao', 'Dhruv Chopra', 'Ira Pillai', 'Shaurya Kumar', 'Zara Agarwal'];
  
  const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
  const sharingTypes = ['2-sharing', '3-sharing', '4-sharing', '5-sharing', '6-sharing'];
  const roomTypes = ['AC', 'Non-AC'];
  
  return names.map((name, i) => {
    const year = Math.floor(Math.random() * 2) + 2; // Years 2-3 only (4th year rare)
    const maxRanks = { 2: 600, 3: 500, 4: 400 };
    const rank = Math.floor(Math.random() * (maxRanks[year] / 10)) + 1;
    
    // Determine group size based on index
    let groupSize = 2 + Math.floor(i / 5);
    if (groupSize > 6) groupSize = Math.floor(Math.random() * 5) + 2;
    
    // Generate roommate list (excluding self)
    const roommates = [];
    for (let j = 1; j < groupSize; j++) {
      const roommateIdx = (i + j) % 20;
      roommates.push(`2021${String(roommateIdx + 101).padStart(3, '0')}`);
    }
    
    return {
      name,
      regNo: `2021${String(i + 101).padStart(3, '0')}`,
      year,
      rank,
      accessibility: Math.random() > 0.95,
      preferences: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, (_, j) => {
        const block = j === 0 ? blocks[i % 4] : blocks[Math.floor(Math.random() * blocks.length)];
        const sharing = `${groupSize}-sharing`;
        const type = j < 2 ? 'AC' : roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const blockIdx = blocks.indexOf(block);
        
        // Generate 5-8 room priorities
        const numRooms = 5 + Math.floor(Math.random() * 4);
        const roomPriorities = Array.from({ length: numRooms }, (_, k) => 
          `${blockIdx + 1}${groupSize}${String(k + 1).padStart(2, '0')}`
        );
        
        return {
          priority: j + 1,
          block,
          sharing,
          type,
          roomPriorities,
          roommates: roommates, // Same roommates for all preferences
          backup: j >= 3
        };
      })
    };
  });
};

// Room database
const generateRooms = () => {
  const rooms = [];
  const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
  const roomTypes = ['AC', 'Non-AC'];
  const sharingTypes = [2, 3, 4, 5, 6];
  
  let roomId = 1;
  blocks.forEach((block, blockIdx) => {
    sharingTypes.forEach(capacity => {
      roomTypes.forEach(type => {
        const count = blockIdx === 0 ? 4 : 3;
        for (let i = 0; i < count; i++) {
          rooms.push({
            id: roomId++,
            block,
            roomNo: `${(blockIdx + 1)}${capacity}${String(i + 1).padStart(2, '0')}`,
            capacity,
            type,
            accessibility: Math.random() > 0.85,
            occupants: []
          });
        }
      });
    });
  });
  return rooms;
};

const calculatePriorityScore = (year, rank, maxRanks) => {
  const yearWeights = { 2: 0.6, 3: 0.8, 4: 1.0 };
  const maxRankForYear = maxRanks[year] || 1000;
  const normalizedRank = 1 - (rank / maxRankForYear);
  return yearWeights[year] * normalizedRank;
};

// NEW: Calculate elasticity scores
const calculateElasticity = (student) => {
  const prefs = student.preferences.slice(0, Math.min(5, student.preferences.length));
  
  if (prefs.length < 2) {
    return { block: 0, sharing: 0, type: 0 };
  }
  
  const firstBlock = prefs[0].block;
  const firstSharing = prefs[0].sharing;
  const firstType = prefs[0].type;
  
  let blockChanges = 0;
  let sharingChanges = 0;
  let typeChanges = 0;
  
  for (let i = 1; i < prefs.length; i++) {
    if (prefs[i].block !== firstBlock) blockChanges++;
    if (prefs[i].sharing !== firstSharing) sharingChanges++;
    if (prefs[i].type !== firstType) typeChanges++;
  }
  
  return {
    block: blockChanges / (prefs.length - 1),
    sharing: sharingChanges / (prefs.length - 1),
    type: typeChanges / (prefs.length - 1)
  };
};

const getPreferencePoints = (priority) => {
  const points = { 1: 1000, 2: 500, 3: 333, 4: 250, 5: 200 };
  return points[priority] || 100;
};

const getRoomPriorityMultiplier = (roomNo, roomPriorities) => {
  if (!roomPriorities || roomPriorities.length === 0) {
    return 0.7;
  }
  
  const index = roomPriorities.indexOf(roomNo);
  if (index === -1) {
    return 0.3;
  }
  
  return 1.0 - (index * 0.1);
};

// Main allocation algorithm with elasticity tie-breaking
const allocateRooms = (students, rooms) => {
  const results = {
    allocations: [],
    metrics: { avgSatisfaction: 0, top3Rate: 0, utilization: 0, elasticityTieBreaks: 0 },
    logs: [],
    explanation: { yearRankPriority: '', preferenceMatching: '', elasticityTieBreaking: '', fairness: '' }
  };
  
  const log = (msg) => results.logs.push(msg);
  
  log('🚀 Starting Allocation Algorithm with Elasticity Tie-Breaking');
  log(`📊 Students: ${students.length} | Rooms: ${rooms.length}`);
  
  const availableRooms = JSON.parse(JSON.stringify(rooms));
  const maxRanks = {};
  students.forEach(s => {
    if (!maxRanks[s.year] || s.rank > maxRanks[s.year]) {
      maxRanks[s.year] = s.rank;
    }
  });
  
  log('\n=== Phase 1: Priority & Elasticity Calculation ===');
  const studentPriorities = new Map();
  const studentElasticity = new Map();
  
  students.forEach(student => {
    const priorityScore = calculatePriorityScore(student.year, student.rank, maxRanks);
    const elasticity = calculateElasticity(student);
    
    studentPriorities.set(student.regNo, priorityScore);
    studentElasticity.set(student.regNo, elasticity);
    
    log(`  ${student.regNo} (Year ${student.year}, Rank ${student.rank}):`);
    log(`    Priority: ${priorityScore.toFixed(4)}`);
    log(`    Elasticity: Block=${elasticity.block.toFixed(2)}, Sharing=${elasticity.sharing.toFixed(2)}, Type=${elasticity.type.toFixed(2)}`);
  });
  
  log('\n=== Phase 2: Allocation with Elasticity Tie-Breaking ===');
  
  const sortedStudents = [...students].sort((a, b) => {
    const psA = studentPriorities.get(a.regNo);
    const psB = studentPriorities.get(b.regNo);
    
    // If priority scores are very close (within 0.0001), use elasticity
    if (Math.abs(psA - psB) < 0.0001) {
      const elA = studentElasticity.get(a.regNo);
      const elB = studentElasticity.get(b.regNo);
      
      // Lower elasticity = less flexible = higher priority
      const avgElA = (elA.block + elA.sharing + elA.type) / 3;
      const avgElB = (elB.block + elB.sharing + elB.type) / 3;
      
      return avgElA - avgElB; // Less flexible student gets priority
    }
    
    return psB - psA;
  });
  
  const allocatedStudents = new Set();
  const roomOccupancy = new Map();
  let elasticityTieBreakCount = 0;
  
  sortedStudents.forEach((student) => {
    if (allocatedStudents.has(student.regNo)) {
      log(`  ⏭️  ${student.regNo} - Already allocated`);
      return;
    }
    
    const priorityScore = studentPriorities.get(student.regNo);
    const elasticity = studentElasticity.get(student.regNo);
    let allocated = false;
    
    log(`\n  Processing ${student.regNo} (Priority: ${priorityScore.toFixed(4)})`);
    
    for (const pref of student.preferences) {
      if (allocated) break;
      
      const requestedRoommates = pref.roommates || [];
      const totalGroupSize = 1 + requestedRoommates.length;
      
      log(`    Pref ${pref.priority}: ${pref.block}, ${pref.sharing}, ${pref.type}`);
      log(`       Group size: ${totalGroupSize} (${requestedRoommates.length} roommates)`);
      log(`       Room Priorities: [${(pref.roomPriorities || []).slice(0, 5).join(', ')}...]`);
      
      // Check if sharing matches group size
      const requiredCapacity = parseInt(pref.sharing.charAt(0));
      if (requiredCapacity !== totalGroupSize) {
        log(`       ⚠️  MISMATCH: ${pref.sharing} but group size is ${totalGroupSize}`);
      }
      
      // Check if any roommate is already allocated
      const anyRoommateAllocated = requestedRoommates.some(rm => allocatedStudents.has(rm));
      
      if (anyRoommateAllocated) {
        const allocatedRoommates = requestedRoommates.filter(rm => allocatedStudents.has(rm));
        log(`       ❌ SKIP - Roommates already allocated: [${allocatedRoommates.join(', ')}]`);
        continue;
      }
      
      log(`       ✓ All roommates available`);
      
      // Try to find matching room
      let bestRoom = null;
      let bestRoomScore = -1;
      
      if (pref.roomPriorities && pref.roomPriorities.length > 0) {
        for (const priorityRoomNo of pref.roomPriorities) {
          const room = availableRooms.find(r => {
            if (r.roomNo !== priorityRoomNo) return false;
            if (r.block !== pref.block) return false;
            if (`${r.capacity}-sharing` !== pref.sharing) return false;
            if (r.type !== pref.type) return false;
            if (student.accessibility && !r.accessibility) return false;
            
            const roomKey = `${r.block}-${r.roomNo}`;
            const currentOccupants = roomOccupancy.get(roomKey) || [];
            return (r.capacity - currentOccupants.length) >= totalGroupSize;
          });
          
          if (room) {
            const roomPriorityMult = getRoomPriorityMultiplier(priorityRoomNo, pref.roomPriorities);
            const score = roomPriorityMult;
            
            if (score > bestRoomScore) {
              bestRoom = room;
              bestRoomScore = score;
            }
            
            if (pref.roomPriorities.indexOf(priorityRoomNo) < 3) {
              break;
            }
          }
        }
      }
      
      if (!bestRoom) {
        bestRoom = availableRooms.find(r => {
          if (r.block !== pref.block) return false;
          if (`${r.capacity}-sharing` !== pref.sharing) return false;
          if (r.type !== pref.type) return false;
          if (student.accessibility && !r.accessibility) return false;
          
          const roomKey = `${r.block}-${r.roomNo}`;
          const currentOccupants = roomOccupancy.get(roomKey) || [];
          return (r.capacity - currentOccupants.length) >= totalGroupSize;
        });
        
        if (bestRoom) {
          bestRoomScore = 0.3;
        }
      }
      
      if (bestRoom) {
        const roomKey = `${bestRoom.block}-${bestRoom.roomNo}`;
        
        if (!roomOccupancy.has(roomKey)) {
          roomOccupancy.set(roomKey, []);
        }
        
        const occupants = roomOccupancy.get(roomKey);
        const allMembers = [student.regNo, ...requestedRoommates];
        
        occupants.push(...allMembers);
        allMembers.forEach(regNo => allocatedStudents.add(regNo));
        
        const prefPoints = getPreferencePoints(pref.priority);
        const roomPriorityBonus = bestRoomScore * 100;
        const totalScore = (priorityScore * 10000) + prefPoints + roomPriorityBonus;
        
        // Record allocation for applicant
        results.allocations.push({
          student: {
            name: student.name,
            regNo: student.regNo,
            year: student.year,
            rank: student.rank
          },
          room: {
            block: bestRoom.block,
            roomNo: bestRoom.roomNo,
            type: bestRoom.type,
            capacity: bestRoom.capacity
          },
          preference: pref.priority,
          roomPriority: pref.roomPriorities ? pref.roomPriorities.indexOf(bestRoom.roomNo) + 1 : 'N/A',
          score: totalScore,
          priorityScore,
          elasticity: elasticity,
          groupSize: totalGroupSize,
          roommates: requestedRoommates
        });
        
        // Record allocations for roommates
        requestedRoommates.forEach(rmRegNo => {
          const rmStudent = students.find(s => s.regNo === rmRegNo);
          if (rmStudent) {
            const rmPriorityScore = studentPriorities.get(rmRegNo);
            const rmElasticity = studentElasticity.get(rmRegNo);
            const rmTotalScore = (rmPriorityScore * 10000) + prefPoints + roomPriorityBonus;
            
            results.allocations.push({
              student: {
                name: rmStudent.name,
                regNo: rmStudent.regNo,
                year: rmStudent.year,
                rank: rmStudent.rank
              },
              room: {
                block: bestRoom.block,
                roomNo: bestRoom.roomNo,
                type: bestRoom.type,
                capacity: bestRoom.capacity
              },
              preference: pref.priority,
              roomPriority: pref.roomPriorities ? pref.roomPriorities.indexOf(bestRoom.roomNo) + 1 : 'N/A',
              score: rmTotalScore,
              priorityScore: rmPriorityScore,
              elasticity: rmElasticity,
              groupSize: totalGroupSize,
              allocatedVia: student.regNo,
              roommates: allMembers.filter(r => r !== rmRegNo)
            });
          }
        });
        
        const roomPriorityText = pref.roomPriorities && pref.roomPriorities.indexOf(bestRoom.roomNo) >= 0 
          ? `Room Priority #${pref.roomPriorities.indexOf(bestRoom.roomNo) + 1}` 
          : 'Non-prioritized room';
        
        log(`       ✅ ALLOCATED: Group of ${totalGroupSize} → ${bestRoom.block} ${bestRoom.roomNo} (${roomPriorityText})`);
        log(`          Representative: ${student.regNo}`);
        log(`          Roommates: [${requestedRoommates.join(', ')}]`);
        
        allocated = true;
      } else {
        log(`       ⚠️  No matching room available`);
      }
    }
    
    if (!allocated) {
      log(`    ❌ ${student.regNo} - No allocation possible`);
    }
  });
  
  log('\n=== Phase 3: Metrics Calculation ===');
  
  if (results.allocations.length > 0) {
    const totalSat = results.allocations.reduce((sum, a) => sum + (a.score / 10000), 0);
    results.metrics.avgSatisfaction = (totalSat / results.allocations.length).toFixed(2);
  }
  
  const top3Count = results.allocations.filter(a => a.preference <= 3).length;
  results.metrics.top3Rate = results.allocations.length > 0
    ? ((top3Count / results.allocations.length) * 100).toFixed(1)
    : '0.0';
  
  const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
  results.metrics.utilization = ((results.allocations.length / totalBeds) * 100).toFixed(1);
  
  results.metrics.elasticityTieBreaks = elasticityTieBreakCount;
  
  const gotTopRoomChoice = results.allocations.filter(a => a.roomPriority === 1 || a.roomPriority === 2).length;
  const roomPrioritySuccessRate = ((gotTopRoomChoice / results.allocations.length) * 100).toFixed(1);
  
  results.explanation.yearRankPriority = `Year-weighted priority for 2nd/3rd/4th year students (based on CGPA ranks). 3rd-year rank 50: ${calculatePriorityScore(3, 50, {3: 500}).toFixed(4)} vs 2nd-year rank 30: ${calculatePriorityScore(2, 30, {2: 600}).toFixed(4)}. Seniors win!`;
  
  results.explanation.preferenceMatching = `Students submit up to 5 block preferences with at least 5 specific rooms per preference. Room Priority 1 gets 1.0x weight, Room 2 gets 0.9x, etc. ${roomPrioritySuccessRate}% got their top 2 room choices!`;
  
  results.explanation.elasticityTieBreaking = `When two students have nearly identical priority scores (<0.0001 difference), elasticity breaks the tie. Lower elasticity (less flexible) = higher priority. Block elasticity measures willingness to change blocks, sharing elasticity measures flexibility on room size.`;
  
  results.explanation.fairness = `Algorithm processes by priority order. Roommates must be specified (representatives fill form for entire group). If ANY roommate is already allocated, entire preference is skipped. This ensures groups stay together!`;
  
  log(`\n📈 Final Metrics:`);
  log(`  Avg Satisfaction: ${results.metrics.avgSatisfaction}`);
  log(`  Top-3 Rate: ${results.metrics.top3Rate}%`);
  log(`  Utilization: ${results.metrics.utilization}%`);
  log(`  Room Priority Success: ${roomPrioritySuccessRate}%`);
  log(`  Elasticity Tie-Breaks: ${elasticityTieBreakCount}`);
  
  return results;
};

const App = () => {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState(generateRooms());
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [isRunning, setIsRunning] = useState(false);
  const [editData, setEditData] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const handleLoadSample = () => {
    const sampleData = generateSampleData();
    setStudents(sampleData);
    setEditData(JSON.stringify(sampleData, null, 2));
    alert(`Loaded ${sampleData.length} sample students!\nAll have mandatory roommates and room priorities.`);
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          setStudents(data);
          setEditData(JSON.stringify(data, null, 2));
          alert(`Loaded ${data.length} students from file!`);
        } else {
          alert('Invalid file format. Expected JSON array.');
        }
      } catch (err) {
        alert('Error reading file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  
  const handleSaveEdit = () => {
    try {
      const data = JSON.parse(editData);
      if (Array.isArray(data)) {
        setStudents(data);
        setShowEditor(false);
        alert(`Updated ${data.length} students!`);
      } else {
        alert('Invalid format. Must be a JSON array.');
      }
    } catch (err) {
      alert('JSON parsing error: ' + err.message);
    }
  };
  
  const handleRunAllocation = () => {
    if (students.length === 0) {
      alert('Please load student data first!');
      return;
    }
    
    setIsRunning(true);
    setTimeout(() => {
      const allocationResults = allocateRooms(students, rooms);
      setResults(allocationResults);
      setActiveTab('results');
      setIsRunning(false);
    }, 1000);
  };
  
  const downloadResults = () => {
    if (!results) return;
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'allocation_results.json';
    link.click();
  };
  
  const downloadCSV = () => {
    if (!results) return;
    const csv = [
      ['Reg No', 'Name', 'Year', 'Rank', 'Block', 'Room', 'Type', 'Pref#', 'Room Priority', 'Group Size', 'Roommates', 'Via'].join(','),
      ...results.allocations.map(a => [
        a.student.regNo,
        a.student.name,
        a.student.year,
        a.student.rank,
        a.room.block,
        a.room.roomNo,
        a.room.type,
        a.preference,
        a.roomPriority,
        a.groupSize,
        `"${(a.roommates || []).join(', ')}"`,
        a.allocatedVia || 'Self'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'allocation_results.csv';
    link.click();
  };
  
  const downloadSampleData = () => {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_student_data.json';
    link.click();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Hostel Allocation System</h1>
                <p className="text-sm text-purple-200">Elasticity Tie-Breaking + Room Priority + Year-Rank</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowInfo(true)}
                className="bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition flex items-center gap-2 text-white"
              >
                <Info className="w-5 h-5" />
                <span className="font-semibold">How It Works</span>
              </button>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="text-xs text-purple-200">Students</div>
                <div className="text-xl font-bold text-white">{students.length}</div>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="text-xs text-purple-200">Rooms</div>
                <div className="text-xl font-bold text-white">{rooms.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 How the Algorithm Works</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-purple-600 mb-2">🎯 Elasticity Tie-Breaking (NEW!)</h3>
                  <p className="text-gray-700 mb-2">
                    When two students have nearly identical priority scores, we check their <strong>elasticity</strong>:
                  </p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
                    <strong>Block Elasticity:</strong> How willing they are to change blocks<br/>
                    <strong>Sharing Elasticity:</strong> How flexible on room size<br/>
                    <strong>Type Elasticity:</strong> How flexible on AC/Non-AC<br/><br/>
                    <strong>Lower elasticity = Less flexible = HIGHER PRIORITY</strong>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-purple-600 mb-2">👥 Mandatory Roommates</h3>
                  <p className="text-gray-700">
                    Only <strong>representatives</strong> fill the form for their entire group. Roommate registration numbers are <strong>MANDATORY</strong>. 
                    If any roommate is already allocated, the entire preference is skipped.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-purple-600 mb-2">🏠 Room Priority Processing</h3>
                  <p className="text-gray-700">
                    At least <strong>5 room priorities</strong> required per block preference. Room 1 = 1.0x weight, Room 2 = 0.9x, etc.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex gap-2 bg-white bg-opacity-10 p-1 rounded-lg backdrop-blur-md">
          {[
            { id: 'upload', label: 'Data Upload', icon: Upload },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'rooms', label: 'Rooms', icon: Home },
            { id: 'results', label: 'Results', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload & Edit Student Data</h2>
            
            <div className="space-y-6">
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload JSON File</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload student preferences (representatives with mandatory roommates)
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                />
                <label
                  htmlFor="fileUpload"
                  className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-purple-700 transition"
                >
                  Choose File
                </label>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">Or load sample data with roommates & elasticity</p>
                <button
                  onClick={handleLoadSample}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition shadow-lg"
                >
                  Load Sample Data (With Elasticity)
                </button>
              </div>
              
              {students.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">Data Loaded Successfully!</h4>
                      <p className="text-sm text-green-700">
                        {students.length} students ready for allocation
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditData(JSON.stringify(students, null, 2));
                        setShowEditor(true);
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                      <FileText className="w-5 h-5" />
                      Edit Data
                    </button>
                    
                    <button
                      onClick={downloadSampleData}
                      className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
                    >
                      <Download className="w-5 h-5" />
                      Download Data
                    </button>
                  </div>
                  
                  <button
                    onClick={handleRunAllocation}
                    disabled={isRunning}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Running Algorithm...
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        Run Allocation Algorithm
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {showEditor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Edit Student Data (JSON)</h3>
                    <button
                      onClick={() => setShowEditor(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <textarea
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                      className="w-full h-full min-h-[400px] font-mono text-sm p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex gap-3 p-6 border-t">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setShowEditor(false)}
                      className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Data (Sorted by Priority)</h2>
            
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No student data loaded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4">Reg No</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Year</th>
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Priority</th>
                      <th className="text-left py-3 px-4">Group Size</th>
                      <th className="text-left py-3 px-4">Elasticity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .sort((a, b) => {
                        const maxRanks = {};
                        students.forEach(s => {
                          if (!maxRanks[s.year] || s.rank > maxRanks[s.year]) {
                            maxRanks[s.year] = s.rank;
                          }
                        });
                        const psA = calculatePriorityScore(a.year, a.rank, maxRanks);
                        const psB = calculatePriorityScore(b.year, b.rank, maxRanks);
                        return psB - psA;
                      })
                      .map((student, i) => {
                        const maxRanks = {};
                        students.forEach(s => {
                          if (!maxRanks[s.year] || s.rank > maxRanks[s.year]) {
                            maxRanks[s.year] = s.rank;
                          }
                        });
                        const ps = calculatePriorityScore(student.year, student.rank, maxRanks);
                        const el = calculateElasticity(student);
                        const groupSize = 1 + (student.preferences[0]?.roommates?.length || 0);
                        
                        return (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono">{student.regNo}</td>
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
                                Year {student.year}
                              </span>
                            </td>
                            <td className="py-3 px-4">{student.rank}</td>
                            <td className="py-3 px-4 font-mono text-purple-600 font-semibold">
                              {ps.toFixed(4)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                {groupSize} people
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <div>B:{el.block.toFixed(2)} S:{el.sharing.toFixed(2)} T:{el.type.toFixed(2)}</div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Rooms</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg text-gray-800">{room.block}</div>
                      <div className="text-sm text-gray-600">Room {room.roomNo}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      room.type === 'AC' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {room.type}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Capacity: {room.capacity}-sharing
                  </div>
                  {room.accessibility && (
                    <div className="text-xs text-green-600 mt-1">♿ Accessible</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'results' && (
          <div className="space-y-6">
            {!results ? (
              <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No results yet. Run the allocation algorithm first.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Avg Satisfaction</div>
                    <div className="text-3xl font-bold text-purple-600">{results.metrics.avgSatisfaction}</div>
                    <div className="text-xs text-gray-500 mt-1">Target: 0.8+ (Excellent)</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Top-3 Rate</div>
                    <div className="text-3xl font-bold text-blue-600">{results.metrics.top3Rate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Target: 85%+ (Excellent)</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Utilization</div>
                    <div className="text-3xl font-bold text-green-600">{results.metrics.utilization}%</div>
                    <div className="text-xs text-gray-500 mt-1">Target: 95%+ (Optimal)</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                  <h3 className="font-bold text-lg text-blue-800 mb-3">📊 Algorithm Explanation</h3>
                  <div className="space-y-3 text-sm text-blue-900">
                    <div>
                      <strong>Year-Rank Priority:</strong> {results.explanation.yearRankPriority}
                    </div>
                    <div>
                      <strong>Room Priority Matching:</strong> {results.explanation.preferenceMatching}
                    </div>
                    <div>
                      <strong>Elasticity Tie-Breaking:</strong> {results.explanation.elasticityTieBreaking}
                    </div>
                    <div>
                      <strong>Group Allocation:</strong> {results.explanation.fairness}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={downloadResults}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download JSON
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download CSV
                  </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-2xl p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Room Allocations (Showing Groups)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4">Reg No</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Block</th>
                          <th className="text-left py-3 px-4">Room</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Pref#</th>
                          <th className="text-left py-3 px-4">Group</th>
                          <th className="text-left py-3 px-4">Roommates</th>
                          <th className="text-left py-3 px-4">Via</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.allocations.map((alloc, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-sm">{alloc.student.regNo}</td>
                            <td className="py-3 px-4">{alloc.student.name}</td>
                            <td className="py-3 px-4">{alloc.room.block}</td>
                            <td className="py-3 px-4 font-mono font-semibold">{alloc.room.roomNo}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                alloc.room.type === 'AC' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {alloc.room.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                alloc.preference === 1 ? 'bg-green-100 text-green-700' :
                                alloc.preference <= 3 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                #{alloc.preference}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                {alloc.groupSize} people
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <div className="max-w-xs overflow-hidden text-ellipsis">
                                {(alloc.roommates || []).slice(0, 3).join(', ')}
                                {(alloc.roommates || []).length > 3 && '...'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {alloc.allocatedVia ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Via Rep
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Rep
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-2xl p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Algorithm Logs</h3>
                  <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-auto max-h-96">
                    {results.logs.map((log, i) => (
                      <div key={i} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
