import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../components/ui/use-toast';
import { updateBookingSafetyInfo } from '../lib/booking-safety';

/**
 * Component for editing booking safety information
 * This can be used on the parent dashboard to update pickup/dropoff information
 */
export function BookingSafetyForm({ booking, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dropoffPerson: {
      name: booking?.dropoffPersonName || '',
      relationship: booking?.dropoffPersonRelationship || 'Parent',
      phone: booking?.dropoffPersonPhone || '',
    },
    pickupPerson: {
      name: booking?.pickupPersonName || '',
      relationship: booking?.pickupPersonRelationship || 'Parent',
      phone: booking?.pickupPersonPhone || '',
    },
    altPickupPerson: {
      name: booking?.altPickupPersonName || '',
      relationship: booking?.altPickupPersonRelationship || '',
      phone: booking?.altPickupPersonPhone || '',
    },
    hasAltPickupPerson: !!(booking?.altPickupPersonName),
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.dropoffPerson.name || !formData.dropoffPerson.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required dropoff person details",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.pickupPerson.name || !formData.pickupPerson.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required pickup person details",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // If alternate pickup is enabled, validate those fields too
      if (formData.hasAltPickupPerson) {
        if (!formData.altPickupPerson.name || !formData.altPickupPerson.phone) {
          toast({
            title: "Missing Information",
            description: "Please fill in all alternate pickup person details or disable alternate pickup",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Format the data to send to API
      const safetyInfo = {
        dropoffPerson: formData.dropoffPerson,
        pickupPerson: formData.pickupPerson,
        // Only include alt pickup person if it's enabled
        altPickupPerson: formData.hasAltPickupPerson ? formData.altPickupPerson : null,
      };

      const response = await updateBookingSafetyInfo(booking.id, safetyInfo);
      
      toast({
        title: "Success",
        description: "Safety information updated successfully",
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error("Error updating safety info:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update safety information",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const relationshipOptions = [
    'Parent',
    'Guardian', 
    'Grandparent',
    'Relative',
    'Babysitter',
    'Family Friend',
    'Other'
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Safety Information</CardTitle>
        <CardDescription>
          Please provide the details of who will drop off and pick up the athlete for this lesson.
          This information is required for the safety of all athletes.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Dropoff Person Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Dropoff Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dropoffName">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="dropoffName"
                  value={formData.dropoffPerson.name}
                  onChange={(e) => handleInputChange('dropoffPerson', 'name', e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dropoffRelationship">Relationship <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.dropoffPerson.relationship}
                  onValueChange={(value) => handleInputChange('dropoffPerson', 'relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dropoffPhone">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="dropoffPhone"
                  value={formData.dropoffPerson.phone}
                  onChange={(e) => handleInputChange('dropoffPerson', 'phone', e.target.value)}
                  placeholder="(555) 555-5555"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Pickup Person Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pickup Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupName">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="pickupName"
                  value={formData.pickupPerson.name}
                  onChange={(e) => handleInputChange('pickupPerson', 'name', e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pickupRelationship">Relationship <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.pickupPerson.relationship}
                  onValueChange={(value) => handleInputChange('pickupPerson', 'relationship', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pickupPhone">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="pickupPhone"
                  value={formData.pickupPerson.phone}
                  onChange={(e) => handleInputChange('pickupPerson', 'phone', e.target.value)}
                  placeholder="(555) 555-5555"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Alternate Pickup Person Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasAltPickup"
                checked={formData.hasAltPickupPerson}
                onChange={(e) => setFormData(prev => ({ ...prev, hasAltPickupPerson: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="hasAltPickup" className="text-lg font-semibold">Add Alternate Pickup Person</Label>
            </div>
            
            {formData.hasAltPickupPerson && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="altPickupName">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="altPickupName"
                    value={formData.altPickupPerson.name}
                    onChange={(e) => handleInputChange('altPickupPerson', 'name', e.target.value)}
                    placeholder="Full Name"
                    required={formData.hasAltPickupPerson}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="altPickupRelationship">Relationship <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.altPickupPerson.relationship}
                    onValueChange={(value) => handleInputChange('altPickupPerson', 'relationship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="altPickupPhone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="altPickupPhone"
                    value={formData.altPickupPerson.phone}
                    onChange={(e) => handleInputChange('altPickupPerson', 'phone', e.target.value)}
                    placeholder="(555) 555-5555"
                    required={formData.hasAltPickupPerson}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
            <p className="text-amber-800 text-sm">
              By submitting this form, you are confirming that the individuals listed above
              are authorized to drop off and pick up the athlete(s) for this session.
              Coach Will Tumbles will only release athletes to individuals listed on this form.
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Safety Information"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
