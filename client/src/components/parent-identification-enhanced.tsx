import { Parent, Athlete } from "@shared/schema";
import { BookingLoginModal } from "./booking-login-modal";

interface ParentIdentificationEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onParentConfirmed: (data: {
    parent: Parent;
    selectedAthletes: Athlete[];
    isNewParent: boolean;
  }) => void;
}

export function ParentIdentificationEnhanced({ 
  isOpen, 
  onClose, 
  onParentConfirmed 
}: ParentIdentificationEnhancedProps) {
  console.log("ParentIdentificationEnhanced - isOpen:", isOpen);

  const handleLoginSuccess = (parent: Parent | null) => {
    if (parent) {
      // Existing parent logged in - pass complete data to parent
      onParentConfirmed({
        parent: parent,
        selectedAthletes: [],
        isNewParent: false
      });
    } else {
      // New parent flow - this shouldn't happen with password login
      // But handle it gracefully
      onParentConfirmed({
        parent: null as any, // This will be handled by the parent component
        selectedAthletes: [],
        isNewParent: true
      });
    }
  };

  return (
    <BookingLoginModal
      isOpen={isOpen}
      onClose={onClose}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}