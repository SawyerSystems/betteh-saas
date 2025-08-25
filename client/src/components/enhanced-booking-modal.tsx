import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { BookingFlowProvider } from "@/contexts/BookingFlowContext";
import { BookingWizard } from "./BookingWizard";
import type { Parent, Athlete } from "@shared/schema";

interface EnhancedBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentData?: Parent;
  selectedAthletes?: Athlete[];
  isNewParent?: boolean;
}

export function EnhancedBookingModal({ 
  isOpen, 
  onClose, 
  parentData, 
  selectedAthletes = [], 
  isNewParent = false 
}: EnhancedBookingModalProps) {
  // Determine flow type based on provided data
  const flowType: 'new-user' | 'athlete-modal' | 'parent-portal' = isNewParent ? 'new-user' : 
                   selectedAthletes.length > 0 ? 'athlete-modal' : 
                   'parent-portal';

  console.log("EnhancedBookingModal rendered with:", {
    isOpen,
    parentData: parentData ? {
      id: parentData.id,
      firstName: parentData.firstName || '',
      lastName: parentData.lastName || '',
      email: parentData.email || '',
      phone: parentData.phone || '',
      emergencyContactName: parentData.emergencyContactName || '',
      emergencyContactPhone: parentData.emergencyContactPhone || ''
    } : null,
    selectedAthletes: selectedAthletes.length,
    isNewParent,
    flowType
  });

  const initialState = {
    parentId: parentData?.id,
    selectedAthletes: selectedAthletes.map(athlete => athlete.id),
    parentInfo: parentData ? {
      firstName: parentData.firstName || '',
      lastName: parentData.lastName || '',
      email: parentData.email || '',
      phone: parentData.phone || '',
      emergencyContactName: parentData.emergencyContactName || '',
      emergencyContactPhone: parentData.emergencyContactPhone || ''
    } : undefined
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing via the X button - prevent click outside
      if (!open) return;
    }}>
      <DialogContent className="w-full h-full max-w-full max-h-full sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>Book a Gymnastics Session</DialogTitle>
        </VisuallyHidden>
        <BookingFlowProvider flowType={flowType} initialState={initialState}>
          <BookingWizard onClose={onClose} />
        </BookingFlowProvider>
      </DialogContent>
    </Dialog>
  );
}