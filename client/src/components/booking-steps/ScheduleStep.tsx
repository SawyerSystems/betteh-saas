import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBookingFlow } from "@/contexts/BookingFlowContext";
import { useToast } from "@/hooks/use-toast";
import { BOOKING_FLOWS, BookingFlowType } from "@/contexts/BookingFlowContext";
import { useAvailableTimes } from "@/hooks/useAvailableTimes";
import { formatBookingDate, parseDate } from "@/lib/dateUtils";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function ScheduleStep() {
  const { state, updateState } = useBookingFlow();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    state.selectedTimeSlot?.date ? parseDate(state.selectedTimeSlot.date) || undefined : undefined
  );

  const { data: availableTimes = [], isLoading } = useAvailableTimes(
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    state.lessonType || ''
  );
  
  // Check if athlete is selected and redirect if needed
  useEffect(() => {
    // Skip check for admin flows and 'new-user' flow (which creates athlete later)
    if (state.flowType.startsWith('admin-') || state.flowType === 'new-user') {
      return;
    }
    
    // Check if athlete is selected for parent-portal and athlete-modal flows
    if (state.selectedAthletes.length === 0) {
      // Determine which step we should navigate to
      const targetStep = state.flowType === 'parent-portal' ? 'athleteSelect' : 'athleteInfoForm';
      const targetStepIndex = BOOKING_FLOWS[state.flowType as BookingFlowType].indexOf(targetStep as any);
      
      if (targetStepIndex >= 0) {
        console.log('⚠️ No athlete selected in ScheduleStep! Redirecting to', targetStep);
        
        toast({
          title: "Athlete Selection Required",
          description: "Please select or create an athlete before scheduling.",
          variant: "destructive",
        });
        
        // Update step in next render cycle to avoid state update during render
        setTimeout(() => {
          updateState({ currentStep: targetStepIndex });
        }, 0);
      }
    }
  }, [state.flowType, state.selectedAthletes, updateState, toast]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateState({ 
        selectedTimeSlot: { 
          date: format(date, 'yyyy-MM-dd'), 
          time: '' 
        } 
      });
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      updateState({ 
        selectedTimeSlot: { 
          date: format(selectedDate, 'yyyy-MM-dd'), 
          time 
        } 
      });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-[#0F0276] dark:text-white">Choose Your Adventure Time</h3>
        <p className="text-[#0F0276]/70 dark:text-white/70">
          Select the perfect date and time for your gymnastics lesson
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-[#0F0276] dark:text-white font-medium">Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal min-h-[48px] bg-white/70 border-slate-200/60 hover:bg-white/80 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/15 focus:border-[#0F0276] focus:ring-[#0F0276]/20 dark:focus:border-white/40",
                  !selectedDate && "text-[#0F0276]/50 dark:text-white/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white/90 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Reset time to start of day
                  return date < today || date.getDay() === 0; // Block past dates and Sundays
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {selectedDate && (
          <div>
            <Label className="text-[#0F0276] dark:text-white font-medium">Available Times</Label>
            {isLoading ? (
              <div className="text-center py-8 text-[#0F0276]/70 dark:text-white/70">
                Loading available times...
              </div>
            ) : availableTimes.length === 0 ? (
              <Card className="mt-2 bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]">
                <CardContent className="text-center py-8 text-[#0F0276]/70 dark:text-white/70">
                  No available times for this date. Please select another date.
                </CardContent>
              </Card>
            ) : (
              <RadioGroup 
                value={state.selectedTimeSlot?.time || ''} 
                onValueChange={handleTimeSelect}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                {availableTimes.map((time) => (
                  <Card 
                    key={time}
                    className={cn(
                      "cursor-pointer transition-all bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]",
                      state.selectedTimeSlot?.time === time
                        ? "ring-2 ring-[#D8BD2A] border-[#D8BD2A] bg-white/80 dark:bg-[rgba(0,0,102,0.2)] dark:ring-[#D8BD2A] dark:border-[#D8BD2A]"
                        : "hover:border-[#0F0276]/30 hover:bg-white/70 dark:hover:bg-[rgba(0,0,102,0.15)]"
                    )}
                    onClick={() => handleTimeSelect(time)}
                  >
                    <CardContent className="flex items-center p-3">
                      <RadioGroupItem value={time} id={time} className="mr-2" />
                      <Label htmlFor={time} className={cn(
                        "cursor-pointer flex-1",
                        state.selectedTimeSlot?.time === time
                          ? "text-[#0F0276] dark:text-[#D8BD2A]"
                          : "text-[#0F0276] dark:text-white"
                      )}>
                        {time}
                      </Label>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            )}
          </div>
        )}
      </div>

      {state.selectedTimeSlot?.date && state.selectedTimeSlot?.time && (
        <div className="bg-gradient-to-r from-[#D8BD2A]/10 to-yellow-500/10 border border-[#D8BD2A]/30 p-4 rounded-lg backdrop-blur-sm dark:from-[#D8BD2A]/5 dark:to-yellow-500/5 dark:border-[#D8BD2A]/20">
          <p className="text-sm text-[#D8BD2A] dark:text-[#D8BD2A] font-medium">
            <strong>✅ Selected:</strong> {formatBookingDate(state.selectedTimeSlot.date)} at {state.selectedTimeSlot.time}
          </p>
        </div>
      )}
    </div>
  );
}