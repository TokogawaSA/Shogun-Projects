import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { TOKEN_STORAGE_KEY } from '../../../services/api';
import { socialApi, SocialFilterParams } from '../services/socialApi';
import { SocialInteraction, SocialFeedResponse } from '../../../types/social';

export function useSocialStream(filters: SocialFilterParams = {}) {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [newMentionsCount, setNewMentionsCount] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);

  const queryKey = ['social-interactions', filters];

  // 1. TanStack Query for Paginated Feed
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<SocialFeedResponse>({
    queryKey,
    queryFn: () => socialApi.getInteractions(filters),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // 2. Real-time Socket.io Stream Integration
  useEffect(() => {
    const currentToken = token || localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken || !user?.tenantId) {
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: currentToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`📡 [Social Stream] Connected to tenant gateway (tenant: ${user.tenantId})`);
    });

    // Inbound Mention Received
    socket.on('social:new_interaction', (newInteraction: SocialInteraction) => {
      console.log('⚡ [Social Stream] New interaction received:', newInteraction);

      // Increment badge
      setNewMentionsCount((prev) => prev + 1);

      // Optimistically prepend to active feeds
      queryClient.setQueriesData<SocialFeedResponse>(
        { queryKey: ['social-interactions'] },
        (oldData) => {
          if (!oldData) return oldData;
          // Avoid duplicate insertion
          const exists = oldData.data.some((item) => item.id === newInteraction.id);
          if (exists) return oldData;

          return {
            ...oldData,
            total: oldData.total + 1,
            data: [newInteraction, ...oldData.data],
          };
        }
      );
    });

    // In-thread reply or status update
    socket.on('social:interaction_updated', (updated: SocialInteraction) => {
      console.log('🔄 [Social Stream] Interaction updated:', updated.id);

      queryClient.setQueriesData<SocialFeedResponse>(
        { queryKey: ['social-interactions'] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) => (item.id === updated.id ? updated : item)),
          };
        }
      );
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Social Stream] Socket disconnected (${reason})`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.tenantId, token, queryClient]);

  const clearNewMentionsCount = useCallback(() => {
    setNewMentionsCount(0);
  }, []);

  // 3. Optimistic Reply Mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, replyText }: { id: string; replyText: string }) =>
      socialApi.replyToInteraction(id, replyText),
    onMutate: async ({ id, replyText }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<SocialFeedResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<SocialFeedResponse>(queryKey, {
          ...previousData,
          data: previousData.data.map((item) => {
            if (item.id === id) {
              const currentHistory = item.threadHistory || [];
              const optimisticMsg = {
                id: `temp-${Date.now()}`,
                author: user?.displayName || 'Support Agent',
                handle: '@ShogunSupport',
                content: replyText,
                timestamp: new Date().toISOString(),
                isOutbound: true,
              };
              return {
                ...item,
                status: 'replied',
                threadHistory: [...currentHistory, optimisticMsg],
              };
            }
            return item;
          }),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-interactions'] });
    },
  });

  // 4. Escalate to Task Mutation
  const escalateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { projectId: string; title?: string; priority?: string; description?: string };
    }) => socialApi.escalateToTask(id, payload),
    onSuccess: (response) => {
      queryClient.setQueriesData<SocialFeedResponse>(
        { queryKey: ['social-interactions'] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) =>
              item.id === response.interaction.id ? response.interaction : item
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // 5. Link Contact Mutation
  const linkContactMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        contactId?: string;
        newContact?: { firstName: string; lastName: string; email: string; accountId?: string; phone?: string };
      };
    }) => socialApi.linkContact(id, payload),
    onSuccess: (response) => {
      queryClient.setQueriesData<SocialFeedResponse>(
        { queryKey: ['social-interactions'] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((item) =>
              item.id === response.interaction.id ? response.interaction : item
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });

  return {
    interactions: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    newMentionsCount,
    clearNewMentionsCount,
    replyMutation,
    escalateMutation,
    linkContactMutation,
  };
}

export default useSocialStream;
