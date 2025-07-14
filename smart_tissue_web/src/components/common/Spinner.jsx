import React from "react";

const Spinner = ({ size = 48, color = "#2563eb", className = "" }) => (
  <div
    className={`animate-spin rounded-full border-b-2 border-solid ${className}`}
    style={{
      width: size,
      height: size,
      borderColor: color,
      borderTopColor: "transparent",
    }}
  ></div>
);

export default Spinner;
