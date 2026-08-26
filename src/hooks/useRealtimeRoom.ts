import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { TOKEN_STORAGE_KEY } from '../services/api';

interface RealtimeRoomOptions {
  projectId?: string;
  onTaskUpdated?: (data: any) => void;
  onKanbanMoved?: (data: any) => void;
  onGanttSynced?: (data: any) => void;
  onDealUpdated?: (data: any) => void;
}

export function useRealtimeRoom({
  projectId,
  onTaskUpdated,
  onKanbanMoved,
  onGanttSynced,
  onDealUpdated,
}: RealtimeRoomOptions = {}) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken || !user?.tenantId) {
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;

    const socket = io(socketUrl, {
      auth: {
        token: currentToken,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`⚡ [WebSocket] Connected to Real-time Gateway (Tenant: ${user.tenantId})`);

      if (projectId) {
        socket.emit('join_project_room', projectId);
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('[WebSocket Connection Error]:', err.message);
    });

    // Real-Time Event Handlers
    socket.on('kanban:task_updated', (data) => {
      console.log('🔄 [WebSocket Event] kanban:task_updated', data);
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId || projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', data.projectId || projectId] });
      onTaskUpdated?.(data);
    });

    socket.on('kanban:task_moved', (data) => {
      console.log('🔄 [WebSocket Event] kanban:task_moved', data);
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId || projectId] });
      onKanbanMoved?.(data);
    });

    socket.on('gantt:progress_synced', (data) => {
      console.log('🔄 [WebSocket Event] gantt:progress_synced', data);
      queryClient.invalidateQueries({ queryKey: ['milestones', data.projectId || projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', data.projectId || projectId] });
      onGanttSynced?.(data);
    });

    socket.on('deal:updated', (data) => {
      console.log('🔄 [WebSocket Event] deal:updated', data);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', data.dealId] });
      onDealUpdated?.(data);
    });

    return () => {
      if (projectId) {
        socket.emit('leave_project_room', projectId);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.tenantId, token, projectId, queryClient, onTaskUpdated, onKanbanMoved, onGanttSynced, onDealUpdated]);

  const emitKanbanMove = (data: { projectId: string; taskId: string; newStatus: string; position?: number }) => {
    socketRef.current?.emit('kanban:task_moved', data);
  };

  const emitGanttReschedule = (data: { projectId: string; taskId: string; startDate: string; dueDate: string }) => {
    socketRef.current?.emit('gantt:task_rescheduled', data);
  };

  return {
    socket: socketRef.current,
    emitKanbanMove,
    emitGanttReschedule,
  };
}

export default useRealtimeRoom;
