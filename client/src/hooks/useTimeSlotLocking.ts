import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface TimeSlotLock {
  lockId: string;
  expiresAt: string;
  sessionId: string;
}

export function useTimeSlotLocking() {
  const [currentLock, setCurrentLock] = useState<TimeSlotLock | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const queryClient = useQueryClient();

  // Auto-release lock on unmount
  useEffect(() => {
    return () => {
      if (currentLock) {
        releaseLock();
      }
    };
  }, [currentLock]);

  // Lock a time slot
  const lockTimeSlot = useMutation({
    mutationFn: async ({ date, time, parentId }: { 
      date: string; 
      time: string; 
      parentId?: number;
    }) => {
      const response = await apiRequest('POST', '/api/time-slot-locks/lock', {
        date,
        time,
        parentId,
        sessionId
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentLock({
          lockId: data.lockId,
          expiresAt: data.expiresAt,
          sessionId
        });
        // Invalidate available times to update UI
        queryClient.invalidateQueries({ queryKey: ['/api/available-times'] });
      }
    },
    onError: (error) => {
      console.error('Failed to lock time slot:', error);
    }
  });

  // Release a time slot lock
  const releaseTimeSlot = useMutation({
    mutationFn: async ({ date, time }: { date: string; time: string }) => {
      const response = await apiRequest('POST', '/api/time-slot-locks/release', {
        date,
        time,
        sessionId
      });
      return response.json();
    },
    onSuccess: () => {
      setCurrentLock(null);
      // Invalidate available times to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/available-times'] });
    },
    onError: (error) => {
      console.error('Failed to release time slot lock:', error);
    }
  });

  // Check if a time slot is locked
  const checkTimeSlotLock = useQuery({
    queryKey: ['time-slot-lock', currentLock?.lockId],
    queryFn: async () => {
      if (!currentLock) return null;
      
      const [date, time] = currentLock.lockId.split('_');
      const response = await apiRequest('GET', `/api/time-slot-locks/check/${date}/${time}?sessionId=${sessionId}`);
      return response.json();
    },
    enabled: !!currentLock,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Helper functions
  const lockSlot = (date: string, time: string, parentId?: number) => {
    lockTimeSlot.mutate({ date, time, parentId });
  };

  const releaseLock = () => {
    if (currentLock) {
      const [date, time] = currentLock.lockId.split('_');
      releaseTimeSlot.mutate({ date, time });
    }
  };

  const isSlotLocked = (date: string, time: string) => {
    return currentLock?.lockId === `${date}_${time}`;
  };

  const getLockExpiryTime = () => {
    if (!currentLock) return null;
    return new Date(currentLock.expiresAt);
  };

  const getRemainingLockTime = () => {
    const expiry = getLockExpiryTime();
    if (!expiry) return 0;
    
    const now = new Date();
    const remaining = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  };

  return {
    currentLock,
    sessionId,
    lockSlot,
    releaseLock,
    isSlotLocked,
    getLockExpiryTime,
    getRemainingLockTime,
    lockStatus: lockTimeSlot,
    releaseStatus: releaseTimeSlot,
    checkStatus: checkTimeSlotLock
  };
}

// Hook to display lock countdown
export function useLockCountdown(useTimeSlotLockingHook: ReturnType<typeof useTimeSlotLocking>) {
  const [countdown, setCountdown] = useState(0);
  const { getRemainingLockTime, currentLock } = useTimeSlotLockingHook;

  useEffect(() => {
    if (!currentLock) {
      setCountdown(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingLockTime();
      setCountdown(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentLock, getRemainingLockTime]);

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    countdown,
    formatCountdown,
    isExpiring: countdown > 0 && countdown <= 60, // Last minute warning
    hasExpired: countdown <= 0 && !!currentLock
  };
}