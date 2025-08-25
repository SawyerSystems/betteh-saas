import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ParentModal, ParentModalSection, ParentModalGrid } from "@/components/parent-ui/ParentModal";
import { ParentButton } from "@/components/parent-ui/ParentButton";

const relationshipOptions = [
  "Parent", 
  "Guardian", 
  "Grandparent", 
  "Aunt/Uncle", 
  "Sibling", 
  "Family Friend", 
  "Other"
];

const safetyInfoSchema = z.object({
  dropoffPersonName: z.string().min(1, "Dropoff person name is required"),
  dropoffPersonRelationship: z.string().min(1, "Dropoff person relationship is required"),
  dropoffPersonPhone: z.string().min(1, "Dropoff person phone is required"),
  pickupPersonName: z.string().min(1, "Pickup person name is required"),
  pickupPersonRelationship: z.string().min(1, "Pickup person relationship is required"),
  pickupPersonPhone: z.string().min(1, "Pickup person phone is required"),
  altPickupPersonName: z.string().optional(),
  altPickupPersonRelationship: z.string().optional(),
  altPickupPersonPhone: z.string().optional(),
  updateCurrentBookings: z.boolean().default(false),
});

type SafetyInfoData = z.infer<typeof safetyInfoSchema>;

interface SafetyInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentInfo?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    // Safety info if already set
    dropoffPersonName?: string;
    dropoffPersonRelationship?: string;
    dropoffPersonPhone?: string;
    pickupPersonName?: string;
    pickupPersonRelationship?: string;
    pickupPersonPhone?: string;
    altPickupPersonName?: string;
    altPickupPersonRelationship?: string;
    altPickupPersonPhone?: string;
  };
  hasCurrentBookings: boolean;
}

export function SafetyInformationDialog({
  open,
  onOpenChange,
  parentInfo,
  hasCurrentBookings,
}: SafetyInfoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SafetyInfoData>({
    resolver: zodResolver(safetyInfoSchema),
    defaultValues: {
      dropoffPersonName: parentInfo?.dropoffPersonName || parentInfo?.firstName + " " + parentInfo?.lastName || "",
      dropoffPersonRelationship: parentInfo?.dropoffPersonRelationship || "Parent",
      dropoffPersonPhone: parentInfo?.dropoffPersonPhone || parentInfo?.phone || "",
      pickupPersonName: parentInfo?.pickupPersonName || parentInfo?.firstName + " " + parentInfo?.lastName || "",
      pickupPersonRelationship: parentInfo?.pickupPersonRelationship || "Parent",
      pickupPersonPhone: parentInfo?.pickupPersonPhone || parentInfo?.phone || "",
      altPickupPersonName: parentInfo?.altPickupPersonName || "",
      altPickupPersonRelationship: parentInfo?.altPickupPersonRelationship || "",
      altPickupPersonPhone: parentInfo?.altPickupPersonPhone || "",
      updateCurrentBookings: false,
    },
  });

  const onSubmit = async (data: SafetyInfoData) => {
    try {
      setIsSubmitting(true);
      
      // Save safety information to parent profile
      await apiRequest("POST", "/api/parent/safety-info", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/parent/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/bookings"] });
      
      toast({
        title: "Safety Information Updated",
        description: data.updateCurrentBookings 
          ? "Your safety information and current bookings have been updated."
          : "Your safety information has been updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update safety information:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your safety information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ParentModal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title="Safety Information"
      description="Set who is authorized for pickup and dropoff at your gymnastics sessions"
      size="xl"
    >
      <div className="max-h-[60vh] sm:max-h-none overflow-y-auto px-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dropoff Person */}
            <ParentModalSection title="Authorized Dropoff Person">
              <ParentModalGrid>
                <FormField
                  control={form.control}
                  name="dropoffPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Full name" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dropoffPersonPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ParentModalGrid>
              
              <FormField
                control={form.control}
                name="dropoffPersonRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship to Athlete</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ParentModalSection>

            {/* Pickup Person */}
            <ParentModalSection title="Authorized Pickup Person">
              <ParentModalGrid>
                <FormField
                  control={form.control}
                  name="pickupPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Full name" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickupPersonPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ParentModalGrid>
              
              <FormField
                control={form.control}
                name="pickupPersonRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship to Athlete</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ParentModalSection>

            {/* Alternative Pickup Person */}
            <ParentModalSection title="Alternative Pickup Person (Optional)">
              <ParentModalGrid>
                <FormField
                  control={form.control}
                  name="altPickupPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Full name (optional)" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="altPickupPersonPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
                          className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ParentModalGrid>
              
              <FormField
                control={form.control}
                name="altPickupPersonRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Relationship to Athlete</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="mt-1 border-gray-300 dark:!border-[#B8860B] focus:border-[#0F0276] dark:focus:!border-[#B8860B] dark:!text-[#B8860B]">
                          <SelectValue placeholder="Select relationship (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ParentModalSection>

            {/* Option to update current bookings */}
            {hasCurrentBookings && (
              <FormField
                control={form.control}
                name="updateCurrentBookings"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium text-amber-800 dark:text-amber-200">Update Current Bookings</FormLabel>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Apply these safety details to all your upcoming bookings
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
        <ParentButton 
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </ParentButton>
        <ParentButton 
          type="submit" 
          disabled={isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isSubmitting ? "Saving..." : "Save Safety Information"}
        </ParentButton>
      </div>
    </ParentModal>
  );
}
