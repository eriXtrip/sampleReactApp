// context/NotificationContext.jsx
import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (title, message) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, title, message }]);

    // Remove automatically after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
