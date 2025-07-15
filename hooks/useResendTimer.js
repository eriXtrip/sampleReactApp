import { useState, useEffect, useRef } from 'react';

export const useResendTimer = (initialTime = 30) => {
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setTimer(initialTime);
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setTimer(0);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  return { timer, isRunning: timer > 0, start, reset };
};
