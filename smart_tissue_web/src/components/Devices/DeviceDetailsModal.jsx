import React from "react";

const DeviceDetailsModal = ({ open, onClose, title, details }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="space-y-2">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between text-gray-700">
              <span className="font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <span>{value ?? "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;
