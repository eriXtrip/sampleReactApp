import React, { createContext, useState, useContext } from 'react';

const DownloadContext = createContext();

export const useDownloadQueue = () => useContext(DownloadContext);

export const DownloadProvider = ({ children }) => {
  const [queue, setQueue] = useState([]); // [{id, title, status, progress}]
  const [resumables, setResumables] = useState({}); // {id: resumableDownloadObject}

  const addDownload = (item) => setQueue((q) => [...q, item]);

  const updateDownload = (id, updates) => {
    setQueue((q) =>
      q.map(d => {
        const updated = d.id === id ? { ...d, ...updates } : d;

        // If status is completed, schedule removal after 1 minute
        if (d.id === id && updates.status === 'completed') {
          setTimeout(() => {
            setQueue((prev) => prev.filter(item => item.id !== id));
          }, 20_000); // 20,000 ms = 20 sec
        }

        return updated;
      })
    );
  };

  const removeDownload = (id) => {
    // cancel if resumable exists
    if (resumables[id]) {
      resumables[id].cancelAsync();
      setResumables((r) => {
        const copy = { ...r };
        delete copy[id];
        return copy;
      });
    }

    setQueue((q) => q.filter((d) => d.id !== id));
  };

  const clearQueue = () => {
    // cancel all ongoing downloads
    Object.values(resumables).forEach((r) => r.cancelAsync());
    setResumables({});
    setQueue([]);
  };

  return (
    <DownloadContext.Provider value={{ queue, addDownload, updateDownload, removeDownload, clearQueue }}>
      {children}
    </DownloadContext.Provider>
  );
};
