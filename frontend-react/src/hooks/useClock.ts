import { useState, useEffect } from 'react';

/** Returns a live-updating time string in HH:MM:SS (Indonesian locale) */
export function useClock(): string {
  const format = () =>
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const [time, setTime] = useState(format);

  useEffect(() => {
    const id = setInterval(() => setTime(format()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}
