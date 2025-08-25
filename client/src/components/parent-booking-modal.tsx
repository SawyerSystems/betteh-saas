import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ParentIdentification } from './parent-identification';

interface ParentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLessonType?: string;
  onOpenBookingModal?: (parentData: ParentData | null, athleteData: AthleteData[], focusAreas: string[], isReturning: boolean) => void;
}

interface ParentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  waiverSigned: boolean;
  waiverSignedAt: string | null;
  waiverSignatureName: string | null;
}

interface AthleteData {
  id: string;
  name: string;
  dateOfBirth: string;
  allergies?: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
}

export function ParentBookingModal({ isOpen, onClose, initialLessonType, onOpenBookingModal }: ParentBookingModalProps) {
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [athleteData, setAthleteData] = useState<AthleteData[]>([]);
  const [lastFocusAreas, setLastFocusAreas] = useState<string[]>([]);

  const handleParentIdentified = (parent: any, athletes: any[], lastAreas: string[] = []) => {
    setParentData(parent);
    setAthleteData(athletes);
    setLastFocusAreas(lastAreas);
    // Close this modal and open booking modal with data
    onClose();
    onOpenBookingModal?.(parent, athletes, lastAreas, true);
  };

  const handleNewParent = () => {
    // Close this modal and open booking modal without data
    onClose();
    onOpenBookingModal?.(null, [], [], false);
  };



  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a Lesson</DialogTitle>
        </DialogHeader>
        
        <ParentIdentification
          onParentIdentified={handleParentIdentified}
          onNewParent={handleNewParent}
        />
      </DialogContent>
    </Dialog>
  );
}