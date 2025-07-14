import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ size = "w-8 h-8", color = "text-blue-600" }) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${size} ${color} animate-spin`} />
    </div>
  );
};

export default LoadingSpinner;
