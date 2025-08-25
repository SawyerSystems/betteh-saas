import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, AlertCircle } from "lucide-react";
import { GYMNASTICS_EVENTS } from "@/lib/constants";

// Define the events object with event-specific skill names to avoid confusion
const EVENTS = {
  tumbling: {
    name: "Tumbling",
    skills: [
      "Tumbling: Forward Roll", "Tumbling: Backward Roll", "Tumbling: Cartwheel", "Tumbling: Round-off", "Tumbling: Handstand",
      "Tumbling: Bridge", "Tumbling: Back Walkover", "Tumbling: Front Walkover", "Tumbling: Back Handspring",
      "Tumbling: Front Handspring", "Tumbling: Back Tuck", "Tumbling: Front Tuck", "Tumbling: Layout", "Tumbling: Twist"
    ]
  },
  beam: {
    name: "Beam",
    skills: [
      "Beam: Handstand and Handstand Dismounts", "Beam: Backward Roll", "Beam: Cartwheel",
      "Beam: Back Walkover", "Beam: Back Handspring", "Beam: Split Leap", "Beam: Full Turn",
      "Beam: Side Aerial", "Beam: Back Tuck Dismount"
    ]
  },
  vault: {
    name: "Vault",
    skills: [
      "Vault: Handspring", "Vault: Handspring ½", "Vault: Half-On", "Vault: Front Pike", "Vault: Yurchenko Timer"
    ]
  },
  bars: {
    name: "Bars",
    skills: [
      "Bars: Spin-the-Cat", "Bars: Kickover", "Bars: Cast", "Bars: Pullover", "Bars: Glide Kip",
      "Bars: Cast Handstand", "Bars: Back Hip Circle", "Bars: Flyaway", "Bars: Baby Giant",
      "Bars: Toe-On Circle", "Bars: Clear Hip to Handstand"
    ]
  },
  "side-quests": {
    name: "Side Quests",
    skills: [
      "Side Quests: Flexibility Training",
      "Side Quests: Strength Training", 
      "Side Quests: Agility Training",
      "Side Quests: Meditation and Breathing Techniques",
      "Side Quests: Mental Blocks"
    ]
  }
};

interface TwoStepFocusAreasProps {
  selectedFocusAreas: string[];
  onFocusAreasChange: (areas: string[]) => void;
  maxSelections?: number;
}

export function TwoStepFocusAreas({ 
  selectedFocusAreas, 
  onFocusAreasChange, 
  maxSelections = 2 
}: TwoStepFocusAreasProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [showWarning, setShowWarning] = useState(false);

  // Load parent apparatus availability and apparatus list for id->name mapping
  const { data: siteContent } = useQuery<any>({
    queryKey: ['/api/site-content'],
    queryFn: async () => (await apiRequest('GET', '/api/site-content')).json(),
    staleTime: 60_000,
  });
  const { data: apparatusList } = useQuery<any>({
    queryKey: ['/api/apparatus'],
    queryFn: async () => (await apiRequest('GET', '/api/apparatus')).json(),
    staleTime: 60_000,
  });
  const parentAllowedIds: number[] | null = siteContent?.about?.apparatusAvailability?.parent ?? null;
  const allowedEventNames = useMemo(() => {
    const allEventNames = Object.values(EVENTS).map(e => e.name);
    if (!Array.isArray(parentAllowedIds) || parentAllowedIds.length === 0) return allEventNames; // allow all by default
    if (!Array.isArray(apparatusList)) return allEventNames;
    const idToName = new Map<number, string>(apparatusList.map((a: any) => [a.id, a.name]));
    const names = parentAllowedIds.map((id: number) => idToName.get(id)).filter(Boolean) as string[];
    // Always include Side Quests (not a DB apparatus)
    return Array.from(new Set([...names, 'Side Quests']));
  }, [parentAllowedIds, apparatusList]);

  const handleEventChange = (eventKey: string) => {
    setSelectedEvent(eventKey);
    setSelectedSkill(""); // Reset skill selection when event changes
  };

  const handleSkillChange = (skill: string) => {
    setSelectedSkill(skill);
  };

  const addFocusArea = () => {
    if (!selectedEvent || !selectedSkill) return;

    // Check if already selected
    if (selectedFocusAreas.includes(selectedSkill)) {
      return;
    }

    // Check max selections
    if (selectedFocusAreas.length >= maxSelections) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    // Add the skill
    onFocusAreasChange([...selectedFocusAreas, selectedSkill]);
    
    // Reset selections for next addition
    setSelectedEvent("");
    setSelectedSkill("");
  };

  const removeFocusArea = (skill: string) => {
    onFocusAreasChange(selectedFocusAreas.filter(area => area !== skill));
    setShowWarning(false);
  };

  const getEventForSkill = (skill: string): string => {
    if (skill.startsWith("Tumbling:")) return "Tumbling";
    if (skill.startsWith("Beam:")) return "Beam";
    if (skill.startsWith("Vault:")) return "Vault";
    if (skill.startsWith("Bars:")) return "Bars";
    return "Unknown";
  };

  const getAvailableSkills = (): string[] => {
    if (!selectedEvent) return [];
    const eventData = EVENTS[selectedEvent as keyof typeof EVENTS];
    return eventData?.skills || [];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Focus Areas (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Select up to {maxSelections} skills you'd like to work on during the lesson
        </p>
      </div>

      {/* Selection Counter */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium">
          Selected: {selectedFocusAreas.length} / {maxSelections} Focus Areas
        </span>
        {selectedFocusAreas.length > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {selectedFocusAreas.length} Selected
          </Badge>
        )}
      </div>

      {/* Warning Message */}
      {showWarning && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-800">
            You can only select up to {maxSelections} focus areas for a 30-minute session.
          </span>
        </div>
      )}

      {/* Selected Focus Areas Display */}
      {selectedFocusAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedFocusAreas.map((skill) => (
                <Badge key={skill} variant="outline" className="flex items-center gap-1 pr-1">
                  <span className="text-xs">
                    {skill}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => removeFocusArea(skill)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-Step Selection */}
      {selectedFocusAreas.length < maxSelections && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Focus Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Select Event */}
            <div className="space-y-2">
              <Label htmlFor="event-select">Step 1: Select Gymnastics Event</Label>
              <Select value={selectedEvent} onValueChange={handleEventChange}>
                <SelectTrigger id="event-select">
                  <SelectValue placeholder="Choose an event (Tumbling, Beam, Vault, Bars)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENTS)
                    .filter(([_, event]) => allowedEventNames.includes(event.name))
                    .map(([key, event]) => (
                      <SelectItem key={key} value={key}>
                        {event.name}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Skill */}
            {selectedEvent && (
              <div className="space-y-2">
                <Label htmlFor="skill-select">
                  Step 2: Select Skill from {EVENTS[selectedEvent as keyof typeof EVENTS]?.name}
                </Label>
                <Select value={selectedSkill} onValueChange={handleSkillChange}>
                  <SelectTrigger id="skill-select">
                    <SelectValue placeholder="Choose a specific skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSkills().map((skill) => (
                      <SelectItem 
                        key={skill} 
                        value={skill}
                        disabled={selectedFocusAreas.includes(skill)}
                      >
                        {skill}
                        {selectedFocusAreas.includes(skill) && (
                          <span className="text-xs text-muted-foreground ml-2">(Already selected)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Add Button */}
            {selectedEvent && selectedSkill && (
              <Button 
                onClick={addFocusArea}
                disabled={selectedFocusAreas.includes(selectedSkill) || selectedFocusAreas.length >= maxSelections}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add "{selectedSkill}" to Focus Areas
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}