import { useEffect, useRef } from 'react';
import { socketService, type AppSocket } from '@/services/socket';
import { useScaleStore } from '@/store/scaleStore';
import type { ScaleType } from '@/types';

/**
 * Initialises the Socket.IO connection once and wires up connection-status
 * listeners.  Returns the socket instance for use in other hooks.
 *
 * Call this once at the root of the app (DashboardPage or App).
 */
export function useSocket(): AppSocket | null {
  const socketRef = useRef<AppSocket | null>(null);
  const setConnection = useScaleStore((s) => s.setConnection);

  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;

    // ── Connection / disconnection ──────────────────────────────────────────

    const onDisconnect = () => {
      setConnection('small', false);
      setConnection('large', false);
    };

    // Generic serial-status (some backends send a .scale field)
    const onSerialStatus = (data: { scale?: string; connected: boolean }) => {
      const scale = data.scale === 'large' ? 'large' : 'small';
      setConnection(scale as ScaleType, !!data.connected);
    };

    socket.on('disconnect',           onDisconnect);
    socket.on('serial-status',        onSerialStatus);
    socket.on('serial-status:small',  (d) => setConnection('small', !!d.connected));
    socket.on('serial-status:large',  (d) => setConnection('large', !!d.connected));

    return () => {
      socket.off('disconnect',          onDisconnect);
      socket.off('serial-status',       onSerialStatus);
      socket.off('serial-status:small');
      socket.off('serial-status:large');
      // Note: we do NOT call socketService.disconnect() here because this hook
      // lives at the app root — the socket should stay alive for the session.
    };
  }, [setConnection]);

  return socketRef.current;
}
