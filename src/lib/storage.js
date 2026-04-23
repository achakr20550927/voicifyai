const STORAGE_KEY = 'founder_os_processes';

export const getProcesses = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProcess = (process) => {
  const processes = getProcesses();
  const newProcess = {
    ...process,
    id: process.id || Date.now(),
    date: process.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  };
  
  // Check if it already exists to update
  const index = processes.findIndex(p => p.id === newProcess.id);
  if (index !== -1) {
    processes[index] = newProcess;
  } else {
    processes.unshift(newProcess);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
  return newProcess;
};

export const deleteProcess = (id) => {
  const processes = getProcesses();
  const filtered = processes.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const renameProcess = (id, newTitle) => {
  const processes = getProcesses();
  const index = processes.findIndex(p => p.id === id);
  if (index !== -1) {
    processes[index].title = newTitle;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
  }
};
