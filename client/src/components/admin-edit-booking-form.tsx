import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Booking } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, MessageSquare, Shield, User, Users } from "lucide-react";
import React, { useState } from 'react';

type AdminEditBookingFormProps = {
  booking: Booking;
  onClose: () => void;
};

export function AdminEditBookingForm({ booking, onClose }: AdminEditBookingFormProps) {
  // Safety Information
  const [dropoffPersonName, setDropoffPersonName] = useState(booking.dropoffPersonName || '');
  const [dropoffPersonRelationship, setDropoffPersonRelationship] = useState(booking.dropoffPersonRelationship || '');
  const [dropoffPersonPhone, setDropoffPersonPhone] = useState(booking.dropoffPersonPhone || '');
  const [pickupPersonName, setPickupPersonName] = useState(booking.pickupPersonName || '');
  const [pickupPersonRelationship, setPickupPersonRelationship] = useState(booking.pickupPersonRelationship || '');
  const [pickupPersonPhone, setPickupPersonPhone] = useState(booking.pickupPersonPhone || '');
  const [altPickupPersonName, setAltPickupPersonName] = useState(booking.altPickupPersonName || '');
  const [altPickupPersonRelationship, setAltPickupPersonRelationship] = useState(booking.altPickupPersonRelationship || '');
  const [altPickupPersonPhone, setAltPickupPersonPhone] = useState(booking.altPickupPersonPhone || '');
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes || '');
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateBookingMutation = useMutation({
    mutationFn: async (data: {
      dropoffPersonName: string;
      dropoffPersonRelationship: string;
      dropoffPersonPhone: string;
      pickupPersonName: string;
      pickupPersonRelationship: string;
      pickupPersonPhone: string;
      altPickupPersonName?: string;
      altPickupPersonRelationship?: string;
      altPickupPersonPhone?: string;
      adminNotes?: string;
      specialRequests?: string;
    }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${booking.id}`, data);
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Updated",
        description: "Booking information has been updated successfully."
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update booking. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required safety fields
    if (!dropoffPersonName || !dropoffPersonRelationship || !dropoffPersonPhone || 
        !pickupPersonName || !pickupPersonRelationship || !pickupPersonPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required pickup and drop-off information.",
        variant: "destructive"
      });
      return;
    }
    
    updateBookingMutation.mutate({
      dropoffPersonName,
      dropoffPersonRelationship,
      dropoffPersonPhone,
      pickupPersonName,
      pickupPersonRelationship,
      pickupPersonPhone,
      altPickupPersonName,
      altPickupPersonRelationship,
      altPickupPersonPhone,
      adminNotes,
      specialRequests
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Safety Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2 pb-2 border-b border-blue-100">
          <Shield className="w-5 h-5 text-blue-700" />
          Safety Information
        </h3>
        
        {/* Drop-off Person Section */}
        <div className="space-y-4 bg-gradient-to-r from-white to-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100 shadow-sm">
          <h4 className="font-medium text-blue-700 flex items-center gap-1.5">
            <User className="w-4 h-4" />
            Drop-off Person Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="dropoff-name" className="text-sm text-gray-700">Name*</Label>
              <input
                id="dropoff-name"
                value={dropoffPersonName}
                onChange={(e) => setDropoffPersonName(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="dropoff-relationship" className="text-sm text-gray-700">Relationship to Athlete*</Label>
              <input
                id="dropoff-relationship"
                value={dropoffPersonRelationship}
                onChange={(e) => setDropoffPersonRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                placeholder="Parent, Guardian, etc."
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="dropoff-phone" className="text-sm text-gray-700">Phone Number*</Label>
              <input
                id="dropoff-phone"
                value={dropoffPersonPhone}
                onChange={(e) => setDropoffPersonPhone(e.target.value)}
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Pick-up Person Section */}
        <div className="space-y-4 bg-gradient-to-r from-white to-green-50 p-3 sm:p-4 rounded-xl border border-green-100 shadow-sm">
          <h4 className="font-medium text-green-700 flex items-center gap-1.5">
            <User className="w-4 h-4" />
            Pick-up Person Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="pickup-name" className="text-sm text-gray-700">Name*</Label>
              <input
                id="pickup-name"
                value={pickupPersonName}
                onChange={(e) => setPickupPersonName(e.target.value)}
                className="w-full px-3 py-2 border border-green-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="pickup-relationship" className="text-sm text-gray-700">Relationship to Athlete*</Label>
              <input
                id="pickup-relationship"
                value={pickupPersonRelationship}
                onChange={(e) => setPickupPersonRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-green-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                placeholder="Parent, Guardian, etc."
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pickup-phone" className="text-sm text-gray-700">Phone Number*</Label>
              <input
                id="pickup-phone"
                value={pickupPersonPhone}
                onChange={(e) => setPickupPersonPhone(e.target.value)}
                className="w-full px-3 py-2 border border-green-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-green-300 focus:border-green-300 transition-all"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Alternative Pick-up Person Section */}
                {/* Alternative Pick-up Person Section */}
        <div className="space-y-4 bg-gradient-to-r from-white to-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100 shadow-sm">
          <h4 className="font-medium text-purple-700 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Alternative Pick-up Person (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="alt-pickup-name" className="text-sm text-gray-700">Name</Label>
              <input
                id="alt-pickup-name"
                value={altPickupPersonName}
                onChange={(e) => setAltPickupPersonName(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="alt-pickup-relationship" className="text-sm text-gray-700">Relationship to Athlete</Label>
              <input
                id="alt-pickup-relationship"
                value={altPickupPersonRelationship}
                onChange={(e) => setAltPickupPersonRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                placeholder="Parent, Guardian, etc."
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="alt-pickup-phone" className="text-sm text-gray-700">Phone Number</Label>
              <input
                id="alt-pickup-phone"
                value={altPickupPersonPhone}
                onChange={(e) => setAltPickupPersonPhone(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm mt-1 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin Notes Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
          <FileText className="w-5 h-5 text-gray-700" />
          Additional Information
        </h3>
        <div className="bg-gradient-to-r from-white to-amber-50 p-3 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
          <Label htmlFor="admin-notes" className="text-sm font-medium text-amber-800 flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4" />
            Admin Notes
          </Label>
          <textarea
            id="admin-notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full px-3 py-2 border border-amber-200 rounded-md h-24 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-all"
            placeholder="Internal notes visible only to admin"
          />
        </div>
        <div className="bg-gradient-to-r from-white to-teal-50 p-3 sm:p-4 rounded-xl border border-teal-100 shadow-sm">
          <Label htmlFor="special-requests" className="text-sm font-medium text-teal-800 flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4" />
            Special Requests
          </Label>
          <textarea
            id="special-requests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-3 py-2 border border-teal-200 rounded-md h-24 text-sm focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-all"
            placeholder="Special requests from parents"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="w-full sm:w-auto border-gray-300 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={updateBookingMutation.isPending}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all duration-200"
        >
          {updateBookingMutation.isPending ? 'Updating...' : 'Update Booking'}
        </Button>
      </div>
    </form>
  );
}
