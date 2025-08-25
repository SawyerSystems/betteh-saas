import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBookingFlow } from "@/contexts/BookingFlowContext";
import { cn } from "@/lib/utils";
import { Clock, Users, User } from "lucide-react";
import { useLessonTypes } from "@/hooks/useLessonTypes";

export function LessonTypeStep() {
  const { state, updateState } = useBookingFlow();
  const { data: lessonTypes, isLoading, error, formatDuration } = useLessonTypes();

  const handleLessonSelect = (lessonType: string) => {
    updateState({ lessonType });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#0F0276] dark:text-white">Choose Your Adventure</h2>
        <p className="text-[#0F0276]/70 dark:text-white/70">
          Select the type of gymnastics lesson that best fits your goals and schedule.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(lessonTypes || []).map((lt) => {
          const isSelected = state.lessonType === lt.name.toLowerCase().replace(/\s+/g, '-');
          const Icon = lt.maxAthletes > 1 ? Users : (lt.isPrivate ? User : Users);
          return (
            <Card 
              key={lt.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]",
                isSelected ? "ring-2 ring-[#D8BD2A] border-[#D8BD2A] bg-white/80 dark:bg-[rgba(0,0,102,0.2)] dark:ring-[#D8BD2A]" : "hover:border-[#0F0276]/30 hover:bg-white/70 dark:hover:bg-[rgba(0,0,102,0.15)]"
              )}
              onClick={() => handleLessonSelect(lt.name.toLowerCase().replace(/\s+/g, '-'))}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isSelected ? "bg-[#D8BD2A]/20 text-[#D8BD2A]" : "bg-[#0F0276]/10 text-[#0F0276] dark:bg-[#D8BD2A]/20 dark:text-[#D8BD2A]"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#0F0276] dark:text-[#D8BD2A]">{lt.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-[#0F0276]/70 dark:text-white">
                        <span>{formatDuration(lt.duration)}</span>
                        <span>•</span>
                        <span>{lt.maxAthletes} {lt.maxAthletes === 1 ? 'athlete' : 'athletes'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold bg-[#D8BD2A]/20 text-[#D8BD2A] border-[#D8BD2A]/30 dark:bg-[#D8BD2A]/20 dark:text-[#D8BD2A] dark:border-[#D8BD2A]/30">
                    ${lt.price}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <CardDescription className="text-sm text-[#0F0276]/70 dark:text-white">
                  {lt.description}
                </CardDescription>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#0F0276] dark:text-white">Perfect for:</p>
                  <ul className="text-xs text-[#0F0276]/70 dark:text-white space-y-1">
                    {(lt.keyPoints || []).map((benefit, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-[#D8BD2A] rounded-full"></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-[#0F0276]/10 to-blue-600/10 border border-[#0F0276]/20 p-4 rounded-lg backdrop-blur-sm dark:bg-[rgba(0,0,102,0.1)] dark:border-[rgba(0,0,102,0.3)]">
        <h3 className="font-semibold text-[#0F0276] dark:text-[#D8BD2A] mb-2">What's Included in Every Lesson:</h3>
        <ul className="text-sm text-[#0F0276]/80 dark:text-[#D8BD2A] space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Warm-up and conditioning appropriate for skill level
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Personalized instruction based on individual goals
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Progress tracking and skill development notes
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Safety-first approach with proper spotting techniques
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Fun, engaging activities to build confidence
          </li>
        </ul>
      </div>
    </div>
  );
}