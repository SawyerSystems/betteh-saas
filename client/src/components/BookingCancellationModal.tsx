import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { Booking } from '@shared/schema';

interface BookingCancellationModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CancellationData {
  reason: string;
  wantsReschedule: boolean;
  preferredRescheduleDate?: string;
  preferredRescheduleTime?: string;
}

export function BookingCancellationModal({ 
  booking, 
  isOpen, 
  onClose, 
  onSuccess 
}: BookingCancellationModalProps) {
  const [step, setStep] = useState<'confirm' | 'details'>('confirm');
  const [cancellationData, setCancellationData] = useState<CancellationData>({
    reason: '',
    wantsReschedule: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const cancelBookingMutation = useMutation({
    mutationFn: async (data: CancellationData) => {
      if (!booking) throw new Error('No booking selected');
      
      return apiRequest('PATCH', `/api/bookings/${booking.id}/cancel`, {
        reason: data.reason,
        wantsReschedule: data.wantsReschedule,
        preferredRescheduleDate: data.preferredRescheduleDate,
        preferredRescheduleTime: data.preferredRescheduleTime
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/parent/bookings'] });
      toast({ 
        title: 'Booking Cancelled', 
        description: cancellationData.wantsReschedule 
          ? 'Your cancellation request has been sent. We\'ll contact you about rescheduling.' 
          : 'Your booking has been cancelled successfully.'
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Cancellation Failed', 
        description: error.message || 'Failed to cancel booking. Please try again.',
        variant: 'destructive' 
      });
    },
  });

  const handleClose = () => {
    setStep('confirm');
    setCancellationData({ reason: '', wantsReschedule: false });
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirmCancel = () => {
    setStep('details');
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationData.reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for cancellation.',
        variant: 'destructive'
      });
      return;
    }

    if (cancellationData.wantsReschedule && (!cancellationData.preferredRescheduleDate || !cancellationData.preferredRescheduleTime)) {
      toast({
        title: 'Reschedule Details Required',
        description: 'Please provide your preferred reschedule date and time.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    cancelBookingMutation.mutate(cancellationData);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                Cancel Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Date TBD'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">{booking.preferredTime || 'Time TBD'}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Lesson Type: {booking.lessonType}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Keep Booking
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmCancel}
                className="flex-1"
              >
                Cancel Booking
              </Button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Cancellation Details</DialogTitle>
              <DialogDescription>
                Please provide some details about your cancellation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reason" className="text-gray-900 dark:text-gray-100">Reason for cancellation *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please let us know why you need to cancel..."
                  value={cancellationData.reason}
                  onChange={(e) => setCancellationData(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reschedule"
                    checked={cancellationData.wantsReschedule}
                    onChange={(e) => setCancellationData(prev => ({ 
                      ...prev, 
                      wantsReschedule: e.target.checked,
                      preferredRescheduleDate: '',
                      preferredRescheduleTime: ''
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <Label htmlFor="reschedule" className="text-sm text-gray-900 dark:text-gray-100">
                    I would like to reschedule instead of cancelling
                  </Label>
                </div>

                {cancellationData.wantsReschedule && (
                  <div className="ml-6 space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div>
                      <Label htmlFor="rescheduleDate" className="text-sm text-gray-900 dark:text-gray-100">Preferred new date</Label>
                      <Input
                        type="date"
                        id="rescheduleDate"
                        value={cancellationData.preferredRescheduleDate || ''}
                        onChange={(e) => setCancellationData(prev => ({ 
                          ...prev, 
                          preferredRescheduleDate: e.target.value 
                        }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rescheduleTime" className="text-sm text-gray-900 dark:text-gray-100">Preferred time</Label>
                      <Input
                        type="time"
                        id="rescheduleTime"
                        value={cancellationData.preferredRescheduleTime || ''}
                        onChange={(e) => setCancellationData(prev => ({ 
                          ...prev, 
                          preferredRescheduleTime: e.target.value 
                        }))}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      We'll contact you to confirm the new time based on availability.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep('confirm')} 
                className="flex-1"
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSubmitCancellation}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (
                  cancellationData.wantsReschedule ? 'Request Reschedule' : 'Cancel Booking'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
