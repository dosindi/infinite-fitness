import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Upload, Trash2, Settings, MapPin } from 'lucide-react';

const GPXAnimator = () => {
  const [gpxFiles, setGpxFiles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [mapStyle, setMapStyle] = useState('terrain');
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  // Sample GPX data structure
  const sampleGpxData = [
    {
      id: 1,
      name: "Morning Ride",
      color: "#FF6B6B",
      points: [
        { lat: 40.7128, lon: -74.0060, time: 0, elevation: 10 },
        { lat: 40.7138, lon: -74.0050, time: 1000, elevation: 12 },
        { lat: 40.7148, lon: -74.0040, time: 2000, elevation: 15 },
        { lat: 40.7158, lon: -74.0030, time: 3000, elevation: 18 },
        { lat: 40.7168, lon: -74.0020, time: 4000, elevation: 20 },
      ]
    },
    {
      id: 2,
      name: "Evening Route",
      color: "#4ECDC4",
      points: [
        { lat: 40.7108, lon: -74.0080, time: 0, elevation: 8 },
        { lat: 40.7118, lon: -74.0070, time: 1200, elevation: 10 },
        { lat: 40.7128, lon: -74.0060, time: 2400, elevation: 12 },
        { lat: 40.7138, lon: -74.0050, time: 3600, elevation: 14 },
        { lat: 40.7148, lon: -74.0040, time: 4800, elevation: 16 },
      ]
    }
  ];

  useEffect(() => {
    if (gpxFiles.length === 0) {
      setGpxFiles(sampleGpxData);
    }
  }, []);

  const parseGPX = (gpxContent, fileName) => {
    // Simple GPX parser - in a real app, you'd use a proper XML parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");
    const trackPoints = xmlDoc.querySelectorAll('trkpt');
    
    const points = Array.from(trackPoints).map((point, index) => ({
      lat: parseFloat(point.getAttribute('lat')),
      lon: parseFloat(point.getAttribute('lon')),
      time: index * 1000, // Simplified time calculation
      elevation: point.querySelector('ele') ? parseFloat(point.querySelector('ele').textContent) : 0
    }));

    return {
      id: Date.now(),
      name: fileName.replace('.gpx', ''),
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      points
    };
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const gpxData = parseGPX(e.target.result, file.name);
        setGpxFiles(prev => [...prev, gpxData]);
      };
      reader.readAsText(file);
    });
  };

  const removeGpxFile = (id) => {
    setGpxFiles(prev => prev.filter(file => file.id !== id));
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const maxTime = Math.max(...gpxFiles.flatMap(file => file.points.map(p => p.time)));

  useEffect(() => {
    if (isPlaying && currentTime < maxTime) {
      animationRef.current = setTimeout(() => {
        setCurrentTime(prev => prev + (100 * animationSpeed));
      }, 100);
    } else if (currentTime >= maxTime) {
      setIsPlaying(false);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, animationSpeed, maxTime]);

  const getInterpolatedPosition = (points, time) => {
    if (points.length === 0) return null;
    
    const currentPoint = points.find((p, i) => {
      const nextPoint = points[i + 1];
      return p.time <= time && (!nextPoint || nextPoint.time > time);
    });
    
    if (!currentPoint) return points[0];
    
    const currentIndex = points.indexOf(currentPoint);
    const nextPoint = points[currentIndex + 1];
    
    if (!nextPoint) return currentPoint;
    
    const progress = (time - currentPoint.time) / (nextPoint.time - currentPoint.time);
    
    return {
      lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress,
      lon: currentPoint.lon + (nextPoint.lon - currentPoint.lon) * progress,
      elevation: currentPoint.elevation + (nextPoint.elevation - currentPoint.elevation) * progress
    };
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            GPX Route Animator
          </h1>
          <p className="text-blue-100 mt-2">Visualize and animate your cycling routes</p>
        </div>

        {/* Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                onClick={resetAnimation}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Speed:</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-600">{animationSpeed}x</span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload GPX
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".gpx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>

          {/* Time Progress */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-20">{formatTime(currentTime)}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / maxTime) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-20">{formatTime(maxTime)}</span>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Map Style:</label>
              <select 
                value={mapStyle} 
                onChange={(e) => setMapStyle(e.target.value)}
                className="px-3 py-1 border rounded-lg"
              >
                <option value="terrain">Terrain</option>
                <option value="satellite">Satellite</option>
                <option value="road">Road</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Sidebar - GPX Files */}
          <div className="w-80 p-6 border-r bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Routes ({gpxFiles.length})</h3>
            
            {gpxFiles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No GPX files loaded</p>
            ) : (
              <div className="space-y-3">
                {gpxFiles.map(file => {
                  const currentPos = getInterpolatedPosition(file.points, currentTime);
                  return (
                    <div key={file.id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: file.color }}
                          />
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeGpxFile(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Points: {file.points.length}</div>
                        <div>Duration: {formatTime(file.points[file.points.length - 1]?.time || 0)}</div>
                        {currentPos && (
                          <div>
                            <div>Lat: {currentPos.lat.toFixed(6)}</div>
                            <div>Lon: {currentPos.lon.toFixed(6)}</div>
                            <div>Elevation: {currentPos.elevation.toFixed(1)}m</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Map Area */}
          <div className="flex-1 p-6">
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
              <svg width="100%" height="100%" className="absolute inset-0">
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Render GPX tracks */}
                {gpxFiles.map(file => {
                  const minLat = Math.min(...file.points.map(p => p.lat));
                  const maxLat = Math.max(...file.points.map(p => p.lat));
                  const minLon = Math.min(...file.points.map(p => p.lon));
                  const maxLon = Math.max(...file.points.map(p => p.lon));
                  
                  const width = 600;
                  const height = 300;
                  const padding = 50;
                  
                  const scaleX = (width - 2 * padding) / (maxLon - minLon);
                  const scaleY = (height - 2 * padding) / (maxLat - minLat);
                  
                  const pathData = file.points.map((point, index) => {
                    const x = (point.lon - minLon) * scaleX + padding;
                    const y = height - ((point.lat - minLat) * scaleY + padding);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');
                  
                  const currentPos = getInterpolatedPosition(file.points, currentTime);
                  let currentX = 0, currentY = 0;
                  
                  if (currentPos) {
                    currentX = (currentPos.lon - minLon) * scaleX + padding;
                    currentY = height - ((currentPos.lat - minLat) * scaleY + padding);
                  }
                  
                  return (
                    <g key={file.id}>
                      {/* Full route path */}
                      <path
                        d={pathData}
                        stroke={file.color}
                        strokeWidth="2"
                        fill="none"
                        opacity="0.5"
                      />
                      
                      {/* Animated path */}
                      <path
                        d={pathData}
                        stroke={file.color}
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="5,5"
                        opacity="0.8"
                      />
                      
                      {/* Current position marker */}
                      {currentPos && (
                        <circle
                          cx={currentX}
                          cy={currentY}
                          r="6"
                          fill={file.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
              
              {gpxFiles.length === 0 && (
                <div className="text-center text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Upload GPX files to visualize your routes</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-blue-600">{gpxFiles.length}</div>
                <div className="text-sm text-gray-600">Active Routes</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-green-600">{formatTime(currentTime)}</div>
                <div className="text-sm text-gray-600">Current Time</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-purple-600">{animationSpeed}x</div>
                <div className="text-sm text-gray-600">Speed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPXAnimator;
