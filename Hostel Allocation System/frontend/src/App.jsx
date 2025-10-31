import React, { useState } from 'react';
import { Upload, Play, Download, Users, Home, BarChart3, FileText, AlertCircle, CheckCircle } from 'lucide-react';

// Sample data generator
const generateSampleData = () => {
  const names = ['Aarav Kumar', 'Diya Sharma', 'Arjun Patel', 'Ananya Singh', 'Rohan Gupta', 
                 'Ishita Reddy', 'Kabir Mehta', 'Saanvi Joshi', 'Vihaan Nair', 'Aanya Desai',
                 'Advait Shah', 'Myra Iyer', 'Reyansh Menon', 'Kiara Malhotra', 'Ayaan Kapoor',
                 'Navya Rao', 'Dhruv Chopra', 'Ira Pillai', 'Shaurya Kumar', 'Zara Agarwal'];
  
  const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
  const sharingTypes = ['2-sharing', '3-sharing', '4-sharing', '5-sharing', '6-sharing'];
  const roomTypes = ['AC', 'Non-AC'];
  
  return names.map((name, i) => ({
    name,
    regNo: `2021${String(i + 101).padStart(3, '0')}`,
    year: Math.floor(Math.random() * 3) + 2,
    rank: (i + 1) * 5 + Math.floor(Math.random() * 10),
    accessibility: Math.random() > 0.9,
    preferences: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, (_, j) => ({
      priority: j + 1,
      block: blocks[Math.floor(Math.random() * blocks.length)],
      room: Math.random() > 0.5 ? `${100 + Math.floor(Math.random() * 50)}` : null,
      sharing: sharingTypes[Math.floor(Math.random() * sharingTypes.length)],
      type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      roommates: i < 15 ? [`2021${String((i + 1) % 20 + 101).padStart(3, '0')}`] : [],
      backup: j >= 2 && Math.random() > 0.7
    }))
  }));
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
        const count = blockIdx === 0 ? 3 : 2;
        for (let i = 0; i < count; i++) {
          rooms.push({
            id: roomId++,
            block,
            roomNo: `${(blockIdx + 1)}${capacity}${i + 1}`,
            capacity,
            type,
            accessibility: Math.random() > 0.8,
            occupants: []
          });
        }
      });
    });
  });
  return rooms;
};

// Allocation Algorithm
const allocateRooms = (students, rooms) => {
  const results = {
    allocations: [],
    metrics: {
      avgSatisfaction: 0,
      top3Rate: 0,
      roommateMatchRate: 0,
      utilization: 0
    },
    logs: []
  };
  
  const log = (msg) => results.logs.push(msg);
  
  log('🚀 Starting OR-based allocation algorithm...');
  log(`📊 Total students: ${students.length}`);
  log(`🏠 Total rooms: ${rooms.length}`);
  log(`🛏️  Total capacity: ${rooms.reduce((sum, r) => sum + r.capacity, 0)}`);
  
  const availableRooms = JSON.parse(JSON.stringify(rooms));
  
  log('\n=== Phase 1: Weight Calculation (Linear Programming) ===');
  const weights = new Map();
  const elasticity = new Map();
  
  students.forEach(student => {
    student.preferences.forEach(pref => {
      const key = `${student.regNo}`;
      const priorityScore = 1000 / pref.priority;
      let bonus = 0;
      if (pref.room) bonus += 500;
      bonus += 200;
      bonus += 150;
      bonus += 120;
      if (pref.backup) bonus *= 0.4;
      const weight = priorityScore + bonus;
      
      if (!weights.has(key)) weights.set(key, []);
      weights.get(key).push({ pref, weight });
    });
    
    const topPrefs = student.preferences.slice(0, Math.min(3, student.preferences.length));
    const blockChanges = topPrefs.filter((p, i) => i > 0 && p.block !== topPrefs[0].block).length;
    const shareChanges = topPrefs.filter((p, i) => i > 0 && p.sharing !== topPrefs[0].sharing).length;
    
    elasticity.set(student.regNo, {
      block: topPrefs.length > 1 ? blockChanges / topPrefs.length : 0,
      share: topPrefs.length > 1 ? shareChanges / topPrefs.length : 0
    });
  });
  
  log(`✓ Computed weights for ${students.length} students`);
  
  log('\n=== Phase 2: Priority Sorting (Goal Programming) ===');
  const sortedStudents = [...students].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.rank - b.rank;
  });
  
  log('✓ Students sorted by year and rank');
  
  log('\n=== Phase 3: Integer Programming & Assignment ===');
  
  const allocated = new Set();
  
  sortedStudents.forEach((student) => {
    if (allocated.has(student.regNo)) return;
    
    const studentWeights = weights.get(student.regNo) || [];
    
    for (const { pref, weight } of studentWeights) {
      const compatibleRooms = availableRooms.filter(room => {
        if (room.occupants.length >= room.capacity) return false;
        if (student.accessibility && !room.accessibility) return false;
        if (pref.block !== room.block) return false;
        if (pref.sharing !== `${room.capacity}-sharing`) return false;
        if (pref.type !== room.type) return false;
        if (pref.room && pref.room !== room.roomNo) return false;
        return true;
      });
      
      if (compatibleRooms.length === 0) continue;
      
      let selectedRoom = compatibleRooms[0];
      
      if (compatibleRooms.length > 1) {
        const roommateCount = pref.roommates.length;
        compatibleRooms.sort((a, b) => {
          const aSpace = a.capacity - a.occupants.length;
          const bSpace = b.capacity - b.occupants.length;
          if (aSpace >= roommateCount + 1 && bSpace < roommateCount + 1) return -1;
          if (bSpace >= roommateCount + 1 && aSpace < roommateCount + 1) return 1;
          return bSpace - aSpace;
        });
        selectedRoom = compatibleRooms[0];
      }
      
      selectedRoom.occupants.push(student.regNo);
      allocated.add(student.regNo);
      
      results.allocations.push({
        student: {
          name: student.name,
          regNo: student.regNo,
          year: student.year,
          rank: student.rank
        },
        room: {
          block: selectedRoom.block,
          roomNo: selectedRoom.roomNo,
          type: selectedRoom.type,
          capacity: selectedRoom.capacity
        },
        preference: pref.priority,
        weight,
        satisfaction: weight / 1000
      });
      
      log(`  ✓ ${student.regNo} → ${selectedRoom.block} ${selectedRoom.roomNo} (Pref ${pref.priority})`);
      break;
    }
    
    if (!allocated.has(student.regNo)) {
      log(`  ✗ ${student.regNo} - No compatible room found`);
    }
  });
  
  log('\n=== Phase 4: Metrics Calculation ===');
  
  const totalSatisfaction = results.allocations.reduce((sum, a) => sum + a.satisfaction, 0);
  results.metrics.avgSatisfaction = (totalSatisfaction / results.allocations.length).toFixed(2);
  
  const top3Count = results.allocations.filter(a => a.preference <= 3).length;
  results.metrics.top3Rate = ((top3Count / results.allocations.length) * 100).toFixed(1);
  
  const totalOccupied = availableRooms.reduce((sum, r) => sum + r.occupants.length, 0);
  const totalCapacity = availableRooms.reduce((sum, r) => sum + r.capacity, 0);
  results.metrics.utilization = ((totalOccupied / totalCapacity) * 100).toFixed(1);
  
  let roommateMatches = 0;
  let roommateRequests = 0;
  students.forEach(student => {
    student.preferences.forEach(pref => {
      if (pref.roommates.length > 0) {
        roommateRequests++;
        const studentAlloc = results.allocations.find(a => a.student.regNo === student.regNo);
        if (studentAlloc) {
          const roommatesInSameRoom = pref.roommates.filter(rmRegNo => {
            const rmAlloc = results.allocations.find(a => a.student.regNo === rmRegNo);
            return rmAlloc && 
                   rmAlloc.room.block === studentAlloc.room.block && 
                   rmAlloc.room.roomNo === studentAlloc.room.roomNo;
          });
          if (roommatesInSameRoom.length === pref.roommates.length) {
            roommateMatches++;
          }
        }
      }
    });
  });
  results.metrics.roommateMatchRate = roommateRequests > 0 
    ? ((roommateMatches / roommateRequests) * 100).toFixed(1) 
    : 'N/A';
  
  log(`\n📈 Avg Satisfaction: ${results.metrics.avgSatisfaction}`);
  log(`📊 Top-3 Rate: ${results.metrics.top3Rate}%`);
  log(`🏠 Utilization: ${results.metrics.utilization}%`);
  log(`👥 Roommate Match: ${results.metrics.roommateMatchRate}%`);
  
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
  
  const handleLoadSample = () => {
    const sampleData = generateSampleData();
    setStudents(sampleData);
    setEditData(JSON.stringify(sampleData, null, 2));
    alert(`Loaded ${sampleData.length} sample students! You can now edit the data.`);
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
    }, 500);
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
      ['Reg No', 'Name', 'Year', 'Rank', 'Block', 'Room No', 'Type', 'Capacity', 'Preference', 'Satisfaction'].join(','),
      ...results.allocations.map(a => [
        a.student.regNo,
        a.student.name,
        a.student.year,
        a.student.rank,
        a.room.block,
        a.room.roomNo,
        a.room.type,
        a.room.capacity,
        a.preference,
        a.satisfaction.toFixed(3)
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
                <p className="text-sm text-purple-200">OR-Based Optimization Engine</p>
              </div>
            </div>
            <div className="flex gap-4">
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
                  Upload a JSON file containing student preferences
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
                <p className="text-gray-600 mb-4">Or load sample data for testing</p>
                <button
                  onClick={handleLoadSample}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition shadow-lg"
                >
                  Load 20 Sample Students
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Data</h2>
            
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
                      <th className="text-left py-3 px-4">Preferences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono">{student.regNo}</td>
                        <td className="py-3 px-4">{student.name}</td>
                        <td className="py-3 px-4">Year {student.year}</td>
                        <td className="py-3 px-4">{student.rank}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {student.preferences.length} preferences
                        </td>
                      </tr>
                    ))}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Avg Satisfaction</div>
                    <div className="text-3xl font-bold text-purple-600">{results.metrics.avgSatisfaction}</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Top-3 Rate</div>
                    <div className="text-3xl font-bold text-blue-600">{results.metrics.top3Rate}%</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Utilization</div>
                    <div className="text-3xl font-bold text-green-600">{results.metrics.utilization}%</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-sm text-gray-600 mb-1">Roommate Match</div>
                    <div className="text-3xl font-bold text-orange-600">{results.metrics.roommateMatchRate}%</div>
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
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Room Allocations</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4">Reg No</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Block</th>
                          <th className="text-left py-3 px-4">Room</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Preference</th>
                          <th className="text-left py-3 px-4">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.allocations.map((alloc, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-sm">{alloc.student.regNo}</td>
                            <td className="py-3 px-4">{alloc.student.name}</td>
                            <td className="py-3 px-4">{alloc.room.block}</td>
                            <td className="py-3 px-4">{alloc.room.roomNo}</td>
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
                                'bg-red-100 text-red-700'
                              }`}>
                                #{alloc.preference}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-mono">{alloc.satisfaction.toFixed(2)}</td>
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

export default App
