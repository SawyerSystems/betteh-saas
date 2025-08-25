import { useState } from "react";
import { Trash2, Calendar, CalendarX2, Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type EventRow } from "@/hooks/use-events";

export interface DeletionMode {
  mode: "this" | "future" | "all";
  instanceDate?: string;
}

interface EventDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deletion: DeletionMode) => void;
  event: EventRow | null;
  isLoading?: boolean;
}

export function EventDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  event,
  isLoading = false,
}: EventDeletionModalProps) {
  const [selectedMode, setSelectedMode] = useState<"this" | "future" | "all">("this");

  if (!event) return null;

  const isRecurring = !!event.recurrenceRule;
  const isInstance = event.id.includes(':');
  // Properly extract full instance timestamp after the first colon
  const instanceDate = isInstance 
    ? event.id.substring(event.id.indexOf(':') + 1) 
    : event.instanceDate;

  const handleConfirm = () => {
    const deletion: DeletionMode = {
      mode: selectedMode,
      instanceDate: (selectedMode === "this" || selectedMode === "future") && instanceDate ? instanceDate : undefined,
    };
    console.log("🗑️ [MODAL] Confirming deletion:", { 
      selectedMode, 
      instanceDate, 
      deletion, 
      eventId: event.id, 
      isInstance, 
      isRecurring 
    });
    onConfirm(deletion);
  };

  const formatEventDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Event
          </DialogTitle>
          <DialogDescription>
            You're about to delete "{event.title}"
            {instanceDate && (
              <span className="block mt-1 text-sm font-medium">
                on {formatEventDate(instanceDate)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isRecurring ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is a recurring event. Choose how you'd like to delete it:
            </p>
            
            <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as "this" | "future" | "all")}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="this" id="this" />
                  <Label htmlFor="this" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Delete just this event</div>
                      <div className="text-xs text-muted-foreground">
                        Removes only this occurrence, keeping future events
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="future" id="future" />
                  <Label htmlFor="future" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CalendarX2 className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="font-medium">Delete this and future events</div>
                      <div className="text-xs text-muted-foreground">
                        Ends the series starting from this event
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Archive className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">Delete entire series</div>
                      <div className="text-xs text-muted-foreground">
                        Removes all events in this recurring series
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            This action cannot be undone. The event will be permanently deleted.
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
