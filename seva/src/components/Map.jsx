import React from 'react';
import { MapPin } from 'lucide-react';

const Map = () => {
  return (
    <div className="p-4 h-full flex items-center justify-center">
      <div className="text-center">
        <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Map View</h2>
        <p className="text-gray-500">Map functionality will be implemented here</p>
      </div>
    </div>
  );
};

export default Map;