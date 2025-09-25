import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Menu, X, Search } from 'lucide-react';
import campusMap from '../assets/map.webp';

const Map = () => {
  const [zoom, setZoom] = useState(1.2);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Location data
  const locations = [
    { id: 1, name: "MAIN STAGE AND AMMA'S ROOM" },
    { id: 2, name: "SPECIAL INVITEES RECEPTION" },
    { id: 3, name: "POLICE CONTROL ROOM POLICE WIRELESS AND CCTV ROOM" },
    { id: 4, name: "MEDICAL AID AND AYURVEDA" },
    { id: 5, name: "EXHIBITION" },
    { id: 6, name: "VIP RECEPTION AND DINING" },
    { id: 7, name: "PRESS AND MEDIA" },
    { id: 8, name: "FIRE AND RESCUE TEAM" },
    { id: 9, name: "AMRITA TV" },
    { id: 10, name: "PRASADAM" },
    { id: 11, name: "AMRITA LIFE" },
    { id: 12, name: "AYURVEDA STALL" },
    { id: 13, name: "WESTERN CANTEEN" },
    { id: 14, name: "TAMIL NADU CANTEEN" },
    { id: 15, name: "JUICE STALL" },
    { id: 16, name: "ACCOMMODATION-ETTIMADAI" },
    { id: 17, name: "AYUDH,IKS,LEAP,AMRITA VIDYALAYAM" },
    { id: 18, name: "GENTS TOILET" },
    { id: 19, name: "LADIES TOILET" },
    { id: 20, name: "STALLS" },
    { id: 21, name: "SORTING CENTER AND STUDENT MESS HALL&CANTEEN" },
    { id: 22, name: "HOT WATER" },
    { id: 23, name: "POLICE, FIRE AND MAY I HELP,PRESS" },
    { id: 24, name: "PRESS" },
    { id: 25, name: "PROJECT OFFICE, CPD" },
    { id: 26, name: "TOILET-01" },
    { id: 27, name: "MESS HALL" },
    { id: 28, name: "CAMPUS CLINIC" },
    { id: 29, name: "MAY I HELP YOU" },
    { id: 30, name: "TRIPTHI DINING" },
    { id: 31, name: "ATHITHI DINING" },
    { id: 32, name: "SOUTH CAFE" },
    { id: 33, name: "POLICE MESS" },
    { id: 34, name: "PRESS AND MEDIA MESS" },
    { id: 35, name: "VOLUNTEER CARE COMMITTEE" },
    { id: 36, name: "TOILET-03" },
    { id: 37, name: "TOILET-04" },
    { id: 38, name: "TOILET-05" },
    { id: 39, name: "REGISTRATION" },
    { id: 40, name: "NORTH INDIAN CANTEEN" },
    { id: 41, name: "MBA BUILDING" },
    { id: 42, name: "ARL BUILDING2" },
    { id: 43, name: "BIO TECH CANTEEN" },
    { id: 44, name: "BIO TECH BUILDING" },
    { id: 45, name: "AMMACHI LAB" },
    { id: 46, name: "NILA-ACCOMMODATION" },
    { id: 47, name: "SARASWATI - ACCOMMODATION" },
    { id: 48, name: "GIRLS MESS HALL" },
    { id: 49, name: "KAVERI - VIP ACCOMMODATION" },
    { id: 50, name: "YAMUNA-ACCOMMODATION" },
    { id: 51, name: "GANGA-ACCOMMODATION" },
    { id: 52, name: "BIRTHDAY KITCHEN" },
    { id: 53, name: "BOYS 01 - ACCOMMODATION" },
    { id: 54, name: "BOYS 02-ACCOMMODATION" },
    { id: 55, name: "BOYS 03-ACCOMMODATION" },
    { id: 56, name: "BOYS 04-ACCOMMODATION" },
    { id: 57, name: "BOYS 05-ACCOMMODATION" },
    { id: 58, name: "POLICE MESS HALL" },
    { id: 59, name: "ANNOUNCEMENT" },
    { id: 60, name: "ACCOMMODATION REGISTRATION CENTER" },
    { id: 61, name: "PLATE WASH" },
    { id: 62, name: "FOOD COUNTER" }
  ];

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }

  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });

  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };

  const handleReset = () => {
    setZoom(1.2);
    setPosition({ x: 0, y: 0 });
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="w-full h-screen bg-gray-100 relative overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-30 md:hidden bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-xl z-20 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 w-80 overflow-y-auto`}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Campus Locations</h2>
          
          {/* Search Bar */}
          <div className="mb-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Location List */}
          <div className="space-y-1">
            {filteredLocations.length > 0 ? (
              filteredLocations.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  className={`w-full text-left p-3 text-sm rounded-lg hover:bg-gray-100 transition-colors ${
                    selectedLocation?.id === location.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <span className="font-semibold text-blue-600">{String(location.id).padStart(2, '0')}.</span> {location.name}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No locations found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls - Always visible */}
      <div className="fixed top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors touch-manipulation"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors touch-manipulation"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors touch-manipulation"
          title="Reset View"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className={`h-full select-none transition-all duration-300 ${
          sidebarOpen ? 'ml-0 md:ml-80' : 'ml-0 md:ml-80'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          className="relative transition-transform duration-300 ease-out h-full w-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Map Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={campusMap}
              alt="Campus Map"
              className="max-w-none h-full object-contain pointer-events-none"
              style={{
                minHeight: '100%',
                minWidth: 'auto'
              }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Zoom Level Indicator */}
      <div className="fixed bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default Map;