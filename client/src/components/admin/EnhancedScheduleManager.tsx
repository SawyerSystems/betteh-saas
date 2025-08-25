import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { AdminModal } from "@/components/admin-ui/AdminModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Clock, 
  Plus, 
  Copy, 
  MoreVertical, 
  Trash2, 
  AlertTriangle,
  Calendar,
  RefreshCw
} from "lucide-react";
import { useAvailability, useCreateAvailability, useDeleteAvailability, useUpdateAvailability } from "@/hooks/use-availability";
import { useToast } from "@/hooks/use-toast";
import type { Availability, InsertAvailability } from "@shared/schema";

interface AvailabilityBlock extends Availability {
  isOverride?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

export function EnhancedScheduleManager() {
  const { data: availability = [] } = useAvailability();
  const createAvailability = useCreateAvailability();
  const updateAvailability = useUpdateAvailability();
  const deleteAvailability = useDeleteAvailability();
  const { toast } = useToast();

  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newBlock, setNewBlock] = useState<InsertAvailability>({
    tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true,
    isAvailable: true
  });
  const [isOverride, setIsOverride] = useState(false);
  const [copyToDialogOpen, setCopyToDialogOpen] = useState(false);
  const [blockToCopy, setBlockToCopy] = useState<AvailabilityBlock | null>(null);
  const [selectedDaysForCopy, setSelectedDaysForCopy] = useState<number[]>([]);

  // Group availability blocks by day
  const availabilityByDay = React.useMemo(() => {
    const grouped: Record<number, AvailabilityBlock[]> = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day.value] = availability
        .filter(block => block.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map(block => ({
          ...block,
          // Mark as override if it's outside normal business hours (before 8am or after 8pm)
          isOverride: isOutsideNormalHours(block.startTime, block.endTime)
        }));
    });
    return grouped;
  }, [availability]);

  function isOutsideNormalHours(startTime: string, endTime: string): boolean {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return start < 8 || end > 20;
  }

  function formatTimeRange(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }

  function handleAddBlock() {
    if (selectedDay === null) return;

    createAvailability.mutate({
      ...newBlock,
      dayOfWeek: selectedDay
    }, {
      onSuccess: () => {
        toast({
          title: "Block Added",
          description: `New availability block added for ${DAYS_OF_WEEK[selectedDay].label}`,
        });
        setIsAddingBlock(false);
        setNewBlock({
          tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '17:00',
          isRecurring: true,
          isAvailable: true
        });
        setIsOverride(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add availability block",
          variant: "destructive",
        });
      }
    });
  }

  function handleDuplicateBlock(block: AvailabilityBlock) {
    createAvailability.mutate({
      tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      isRecurring: block.isRecurring,
      isAvailable: block.isAvailable
    }, {
      onSuccess: () => {
        toast({
          title: "Block Duplicated",
          description: `Availability block duplicated for ${DAYS_OF_WEEK[block.dayOfWeek].label}`,
        });
      }
    });
  }

  function handleCopyToOtherDays(block: AvailabilityBlock) {
    setBlockToCopy(block);
    setSelectedDaysForCopy([]);
    setCopyToDialogOpen(true);
  }

  function executeCopyToOtherDays() {
    if (!blockToCopy || selectedDaysForCopy.length === 0) return;

    const promises = selectedDaysForCopy.map(dayOfWeek => {
      const availabilityData: InsertAvailability = {
        tenantId: process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
        dayOfWeek,
        startTime: blockToCopy.startTime,
        endTime: blockToCopy.endTime,
        isRecurring: blockToCopy.isRecurring,
        isAvailable: blockToCopy.isAvailable
      };
      
      console.log('Creating availability with data:', availabilityData);
      return createAvailability.mutateAsync(availabilityData);
    });

    Promise.all(promises).then(() => {
      toast({
        title: "Blocks Copied",
        description: `Availability block copied to ${selectedDaysForCopy.length} day(s)`,
      });
      setCopyToDialogOpen(false);
      setBlockToCopy(null);
      setSelectedDaysForCopy([]);
    }).catch((error) => {
      console.error('Copy blocks error:', error);
      toast({
        title: "Error",
        description: "Failed to copy availability blocks",
        variant: "destructive",
      });
    });
  }

  function handleDeleteBlock(blockId: number) {
    deleteAvailability.mutate(blockId, {
      onSuccess: () => {
        toast({
          title: "Block Deleted",
          description: "Availability block removed successfully",
        });
      }
    });
  }

  function toggleDayForCopy(dayValue: number) {
    setSelectedDaysForCopy(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
            <Calendar className="h-7 w-7 text-[#D8BD2A]" />
            Enhanced Schedule Management
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Manage multiple availability blocks per day with quick actions and admin overrides
          </p>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 gap-6">
        {DAYS_OF_WEEK.map((day) => {
          const dayBlocks = availabilityByDay[day.value] || [];
          
          return (
            <Card key={day.value} className="bg-white/60 backdrop-blur-sm border-slate-200/60 dark:bg-white/10 dark:border-white/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-2">
                    {day.label}
                    {dayBlocks.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {dayBlocks.length} block{dayBlocks.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDay(day.value);
                      setIsAddingBlock(true);
                    }}
                    className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/90 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A] text-black font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Block
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayBlocks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm">No availability blocks set</p>
                    <p className="text-xs">Click "Add Block" to get started</p>
                  </div>
                ) : (
                  dayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        block.isOverride 
                          ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' 
                          : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {formatTimeRange(block.startTime, block.endTime)}
                          </span>
                        </div>
                        {block.isOverride && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Override
                          </Badge>
                        )}
                        {!block.isAvailable && (
                          <Badge variant="destructive">
                            Blocked
                          </Badge>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicateBlock(block)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Duplicate Block
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyToOtherDays(block)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy to Other Days
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Block
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Block Dialog */}
      <AdminModal 
        isOpen={isAddingBlock} 
        onClose={() => setIsAddingBlock(false)}
        title="Add Availability Block"
        size="xl"
        showCloseButton={false}
      >
        <DialogDescription>
          {selectedDay !== null && `Add a new availability block for ${DAYS_OF_WEEK[selectedDay].label}`}
        </DialogDescription>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newBlock.isAvailable}
                onCheckedChange={(checked) => setNewBlock({ ...newBlock, isAvailable: checked })}
              />
              <Label>Available for booking</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={isOverride}
                onCheckedChange={setIsOverride}
              />
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Admin Override (Outside normal hours)
              </Label>
            </div>

            {isOverride && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  This block will be marked as an admin override since it's outside normal business hours (8 AM - 8 PM).
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddingBlock(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBlock}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              Add Block
            </Button>
          </div>
        </AdminModal>

      {/* Copy to Other Days Dialog */}
      <Dialog open={copyToDialogOpen} onOpenChange={setCopyToDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy to Other Days</DialogTitle>
            <DialogDescription>
              {blockToCopy && `Copy the ${formatTimeRange(blockToCopy.startTime, blockToCopy.endTime)} block to other days`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Select days to copy to:</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.filter(day => day.value !== blockToCopy?.dayOfWeek).map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`copy-day-${day.value}`}
                    checked={selectedDaysForCopy.includes(day.value)}
                    onChange={() => toggleDayForCopy(day.value)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`copy-day-${day.value}`}>{day.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyToDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={executeCopyToOtherDays}
              disabled={selectedDaysForCopy.length === 0}
            >
              Copy to {selectedDaysForCopy.length} Day{selectedDaysForCopy.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
