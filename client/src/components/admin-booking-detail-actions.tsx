import { BookingEditModal } from "@/components/BookingEditModal";
import { Button } from "@/components/ui/button";
import type { Booking } from "@shared/schema";
import { useQueryClient } from '@tanstack/react-query';
import { Edit } from "lucide-react";
import { useState } from 'react';

type AdminBookingDetailActionsProps = {
  booking: Booking;
};

export function AdminBookingDetailActions({ booking }: AdminBookingDetailActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <BookingEditModal
        booking={booking}
        open={isEditing}
        onClose={() => setIsEditing(false)}
        onSuccess={handleEditSuccess}
      />
    );
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => setIsEditing(true)}
    >
      <Edit className="h-4 w-4 mr-1" />
      Edit
    </Button>
  );
}
