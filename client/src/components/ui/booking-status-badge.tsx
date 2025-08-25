import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { determineBookingStatus, getBookingStatusColor, getBookingStatusDescription } from '@/lib/booking-status';
import { InfoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BookingStatusBadgeProps {
  paymentStatus: string;
  attendanceStatus: string;
  className?: string;
  showTooltip?: boolean;
  showInfoIcon?: boolean;
}

export function BookingStatusBadge({
  paymentStatus,
  attendanceStatus,
  className = '',
  showTooltip = true,
  showInfoIcon = true,
}: BookingStatusBadgeProps) {
  const [status, setStatus] = useState<string>('');
  const [statusDescription, setStatusDescription] = useState<string>('');
  
  useEffect(() => {
    // Calculate derived status
    const derivedStatus = determineBookingStatus(paymentStatus, attendanceStatus);
    setStatus(derivedStatus);
    
    // Get description for tooltip
    const description = getBookingStatusDescription(derivedStatus, paymentStatus, attendanceStatus);
    setStatusDescription(description);
  }, [paymentStatus, attendanceStatus]);
  
  // Format display status with capitalized first letter and hyphen replacement
  const displayStatus = status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const statusColor = getBookingStatusColor(status);
  
  // If tooltip is disabled, just return the badge
  if (!showTooltip) {
    return (
      <div className={`px-2.5 py-0.5 rounded-full text-sm font-medium inline-flex items-center ${statusColor} ${className}`}>
        {displayStatus}
        {showInfoIcon && <InfoIcon className="ml-1.5 w-3.5 h-3.5 opacity-70" />}
      </div>
    );
  }
  
  // Return badge with tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`px-2.5 py-0.5 rounded-full text-sm font-medium inline-flex items-center cursor-help ${statusColor} ${className}`}>
            {displayStatus}
            {showInfoIcon && <InfoIcon className="ml-1.5 w-3.5 h-3.5 opacity-70" />}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div>
            <p className="font-medium mb-1">Status: {displayStatus}</p>
            <p className="text-sm text-muted-foreground">{statusDescription}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Payment: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).replace(/-/g, ' ')}</p>
              <p>Attendance: {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1).replace(/-/g, ' ')}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
