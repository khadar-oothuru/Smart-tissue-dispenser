import React from "react";
import DeviceDetailsModal from "../Devices/DeviceDetailsModal";

const DeviceDetailsModalRoute = ({ modalData, onClose }) => {
  // modalData should be derived from route params or context
  if (!modalData) return null;
  return (
    <DeviceDetailsModal
      open={true}
      onClose={onClose}
      title={modalData.title}
      details={modalData.details}
    />
  );
};

export default DeviceDetailsModalRoute;
