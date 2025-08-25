import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ParentModal, ParentModalSection, ParentModalGrid } from "@/components/parent-ui/ParentModal";
import { ParentFormInput, ParentFormTextarea, ParentFormSelectTrigger, Select, SelectContent, SelectItem, SelectValue } from "@/components/parent-ui/ParentFormComponents";
import { useGenders } from "@/hooks/useGenders";
import { useCreateAthlete } from "@/hooks/use-athlete";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAthleteModal({ isOpen, onClose }: AddAthleteModalProps) {
  const { genderOptions } = useGenders();
  const { toast } = useToast();
  const createAthleteMutation = useCreateAthlete();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    allergies: "",
  experience: "beginner" as "beginner" | "intermediate" | "advanced",
  isGymMember: false,
  });
  
  // Function to calculate age and validate minimum age requirement
  const validateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) {
      setAgeError(null);
      return true;
    }

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 6) {
      setAgeError(`Athletes must be at least 6 years old. Current age: ${age} years.`);
      return false;
    } else {
      setAgeError(null);
      return true;
    }
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    if (field === 'dateOfBirth') {
      validateAge(value);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (ageError) {
      toast({
        title: "Validation Error",
        description: "Please fix the age validation error before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.experience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createAthleteMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender || undefined,
        allergies: formData.allergies,
        experience: formData.experience,
        isGymMember: formData.isGymMember,
      });
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        allergies: "",
  experience: "beginner",
  isGymMember: false,
      });
      
      // Refresh athletes list
      queryClient.invalidateQueries({ queryKey: ['/api/parent/athletes'] });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error creating athlete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ParentModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Athlete"
      description="Enter the athlete's information to add them to your account"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ParentModalSection title="Basic Information">
          <ParentModalGrid>
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-[#0F0276] dark:text-white">First Name</Label>
              <ParentFormInput
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-[#0F0276] dark:text-white">Last Name</Label>
              <ParentFormInput
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </ParentModalGrid>
        </ParentModalSection>

        <ParentModalSection title="Personal Details">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-[#0F0276] dark:text-white">Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleChange('gender', value)}
              >
                <ParentFormSelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </ParentFormSelectTrigger>
                <SelectContent>
                  {genderOptions.map((gender: string) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-[#0F0276] dark:text-white">Date of Birth</Label>
              <ParentFormInput
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
                className={ageError ? 'border-red-500' : ''}
              />
              {ageError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {ageError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </ParentModalSection>

        <ParentModalSection title="Experience & Membership">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="isGymMember" className="text-[#0F0276] dark:text-white">Already in Gym Classes?</Label>
              <div className="flex items-center justify-between rounded-md border p-3 border-gray-300 dark:border-[#B8860B]">
                <div>
                  <p className="font-medium text-[#0F0276] dark:text-white">Gym Member</p>
                  <p className="text-sm text-[#0F0276]/60 dark:text-white/60">Toggle on if this athlete is already enrolled in gym classes.</p>
                </div>
                <Switch
                  id="isGymMember"
                  checked={formData.isGymMember}
                  onCheckedChange={(checked) => setFormData({ ...formData, isGymMember: checked })}
                  aria-label="Already in Gym Classes?"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#0F0276] dark:text-white">Experience Level</Label>
              <RadioGroup
                value={formData.experience}
                onValueChange={(value) => handleChange('experience', value as "beginner" | "intermediate" | "advanced")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="text-[#0F0276] dark:text-white">Beginner - New to gymnastics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="text-[#0F0276] dark:text-white">Intermediate - Some gymnastics experience</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="text-[#0F0276] dark:text-white">Advanced - Significant gymnastics experience</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ParentModalSection>

        <ParentModalSection title="Additional Information">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies" className="text-[#0F0276] dark:text-white">Allergies or Medical Conditions (Optional)</Label>
              <ParentFormTextarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder="Please list any allergies or medical conditions we should be aware of"
                rows={3}
              />
            </div>
            <p className="text-sm text-[#0F0276]/60 dark:text-white/60">
              Athletes must be at least 6 years old to participate in lessons.
            </p>
          </div>
        </ParentModalSection>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="text-[#0F0276] border-[#0F0276]/50 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/50 dark:hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !!ageError}
            className="bg-[#0F0276] hover:bg-[#0F0276]/90 text-white dark:bg-[#B8860B] dark:hover:bg-[#B8860B]/90 dark:text-[#0F0276]"
          >
            {isSubmitting ? "Creating..." : "Create Athlete"}
          </Button>
        </div>
      </form>
    </ParentModal>
  );
}
