import React, { createContext, useContext, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-start p-4 rounded-lg border shadow-lg mb-3 transform transition-all duration-300 ease-in-out ${getBgColor()}`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="ml-3 flex-1">
        {toast.title && (
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
        )}
        <p className="text-sm text-gray-700">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, title) => addToast({ type: "success", message, title }),
    error: (message, title) => addToast({ type: "error", message, title }),
    warning: (message, title) => addToast({ type: "warning", message, title }),
    info: (message, title) => addToast({ type: "info", message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
        {toasts.map((toastItem) => (
          <Toast key={toastItem.id} toast={toastItem} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
