import React, { useState, useEffect } from "react";

function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message || !visible) return null;

  const getToastClass = () => {
    const baseClass =
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300";

    switch (type) {
      case "success":
        return `${baseClass} bg-green-500 text-white`;
      case "error":
        return `${baseClass} bg-red-500 text-white`;
      case "warning":
        return `${baseClass} bg-yellow-500 text-white`;
      default:
        return `${baseClass} bg-gray-800 text-white`;
    }
  };

  return <div className={getToastClass()}>{message}</div>;
}

export default Toast;
