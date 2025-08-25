// Helper to safely extract name/description from unknown object
function getNameOrDescription(obj: unknown): string {
  if (obj && typeof obj === 'object') {
    if ('name' in obj && typeof (obj as any).name === 'string') return (obj as any).name;
    if ('description' in obj && typeof (obj as any).description === 'string') return (obj as any).description;
    return JSON.stringify(obj);
  }
  return String(obj);
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { AdminContentTabs } from "@/components/admin-ui/AdminContentTabs";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin-ui/AdminCard";
import { AdminButton } from "@/components/admin-ui/AdminButton";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/dateUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Booking } from "@shared/schema";
import { useLessonTypes } from "@/hooks/useLessonTypes";
import { PaymentStatusEnum } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clock, DollarSign, ExternalLink, RefreshCw, TrendingUp, X, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingDetailsModal } from "./modals/BookingDetailsModal";

// Extended payment status types
export type ExtendedPaymentStatus = 
  | "reservation-pending"
  | "reservation-failed" 
  | "reservation-paid"
  | "session-paid"
  | "reservation-refunded"
  | "session-refunded";

// Helper function for extended payment status badge styling
export const getExtendedPaymentStatusBadgeProps = (status: string): { variant: "default" | "secondary" | "destructive" | "outline"; className?: string } => {
  switch (status) {
    case "reservation-pending":
      return { variant: "secondary", className: "bg-yellow-100 text-yellow-800" };
    case "reservation-failed":
      return { variant: "destructive", className: "bg-red-100 text-red-800" };
    case "reservation-paid":
      return { variant: "default", className: "bg-green-100 text-green-800" };
    case "session-paid":
      return { variant: "default", className: "bg-green-500 text-white" };
    case "reservation-refunded":
      return { variant: "outline", className: "bg-gray-100 text-gray-700" };
    case "session-refunded":
      return { variant: "outline", className: "bg-gray-200 text-gray-800" };
    default:
      return { variant: "secondary" };
  }
};


// Price resolution order:
// 1) booking.lessonTypeId -> lookup in lesson types
// 2) booking.lessonType object with price field
// 3) booking.lessonType string -> map by key/name
// 4) legacy booking.amount string (fallback)
const makePriceResolver = (opts: { byKey: (key: string) => any; lessonTypes: Array<{ id: number; price: number; name: string }> }) => (booking: any): number => {
  try {
    // 1) ID lookup
    if (booking.lessonTypeId) {
      const lt = opts.lessonTypes.find((t) => Number(t.id) === Number(booking.lessonTypeId));
      if (lt && typeof lt.price === 'number') return lt.price;
      if (lt && (lt as any).price) return parseFloat((lt as any).price);
    }
    // 2) Object with price
    if (booking.lessonType && typeof booking.lessonType === 'object') {
      const obj = booking.lessonType as any;
      if (typeof obj.price === 'number') return obj.price;
      if (obj.price) return parseFloat(obj.price);
      if (typeof obj.total_price === 'number') return obj.total_price;
      if (obj.total_price) return parseFloat(obj.total_price);
    }
    // 3) String key/name
    if (typeof booking.lessonType === 'string' && booking.lessonType) {
      const lt = opts.byKey(booking.lessonType);
      if (lt && typeof lt.price === 'number') return lt.price;
      if (lt && lt.price) return parseFloat(lt.price);
    }
    // 4) Legacy amount fallback
    if (booking.amount && !isNaN(parseFloat(booking.amount))) return parseFloat(booking.amount);
  } catch {}
  return 0;
};

export function PaymentsTab() {
  const { toast } = useToast();
  const { byKey, data: lessonTypes = [] } = useLessonTypes();
  const getLessonPrice = makePriceResolver({ byKey, lessonTypes });
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);

  // Fetch all bookings
  const { data: bookings = [], isLoading, refetch } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Fetch archived bookings (completed, no-show, cancelled)
  const { data: archivedBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/archived-bookings"],
  });

  const completedArchived = useMemo(
    () => (archivedBookings || []).filter(b => b.attendanceStatus === "completed"),
    [archivedBookings]
  );

  // Enhanced payment analytics
  // Definitions per request:
  // - Total revenue: total accumulated revenue of all completed bookings
  // - Pending reservations: total of all bookings with a pending attendance status
  const totals = {
    pendingReservations: bookings
      .filter(b => b.attendanceStatus === "pending")
      .reduce((sum, b) => sum + getLessonPrice(b), 0),
    totalRevenue: archivedBookings
      .filter(b => b.attendanceStatus === "completed")
      .reduce((sum, b) => sum + getLessonPrice(b), 0),
    refunded: bookings
      .filter(b => b.paymentStatus === "reservation-refunded" || b.paymentStatus === "session-refunded")
      .reduce((sum, b) => sum + parseFloat(b.paidAmount || "0"), 0),
    avgBookingValue: bookings.length > 0 ? (bookings.reduce((sum, b) => sum + getLessonPrice(b), 0) / bookings.length) : 0,
  };

  // Helper to extract lesson type string
  const extractLessonTypeString = (lessonType: unknown): string => {
    if (typeof lessonType === 'string') return lessonType;
    if (lessonType && typeof lessonType === 'object') {
      if ('name' in lessonType && typeof (lessonType as any).name === 'string') return (lessonType as any).name;
      if ('description' in lessonType && typeof (lessonType as any).description === 'string') return (lessonType as any).description;
      return JSON.stringify(lessonType);
    }
    return '';
  };

  // Calculate pending payments (remaining balance after reservation fee)
  const pendingPayments = bookings
    .filter(b => 
      b.paymentStatus === "reservation-paid" && // Only show bookings with reservation paid but not fully paid
      b.status !== "cancelled" && 
      b.attendanceStatus !== "completed" // Automatically exclude completed bookings
    )
    .map(booking => {
      const totalPrice = getLessonPrice(booking);
      const paidAmount = parseFloat(booking.paidAmount || "0");
      const remainingBalance = totalPrice - paidAmount;
      return {
        ...booking,
        totalPrice,
        paidAmount,
        remainingBalance,
      };
    })
    .filter(b => b.remainingBalance > 0);

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      (booking.athlete1Name && booking.athlete1Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.parentEmail && booking.parentEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.parentFirstName && booking.parentFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.parentLastName && booking.parentLastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || booking.preferredDate === dateFilter;
    // Booking Status filter uses booking.status; ensure only valid booking_status values are offered
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === "all" || booking.paymentStatus === paymentStatusFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesPaymentStatus;
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}/payment-status`, { paymentStatus });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to update payment status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Payment status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating payment status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Sync with Stripe mutation
  const syncStripeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/sync-payments", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Smart Stripe sync completed", 
        description: `${data.updated || 0} bookings synced, ${data.skipped || 0} preserved (completed/in-progress)` 
      });
      refetch();
    },
    onError: () => {
      toast({ 
        title: "Error syncing with Stripe", 
        variant: "destructive" 
      });
    },
  });

  return (
    <>
      {/* Enhanced Payment Analytics Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8 w-full mx-auto">
        <Card className="rounded-xl border-0 bg-gradient-to-br from-blue-50 via-blue-25 to-blue-50/30 shadow-md hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-blue-800">Total Revenue</CardTitle>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-900">
              ${totals.totalRevenue.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-blue-600 mt-1 font-medium">All completed bookings</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-yellow-50 via-yellow-25 to-yellow-50/30 shadow-md hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-yellow-800">Pending Reservations</CardTitle>
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-900">
              ${totals.pendingReservations.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-yellow-600 mt-1 font-medium">{bookings.filter(b => b.attendanceStatus === "pending").length} bookings</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-slate-50 via-slate-25 to-slate-50/30 shadow-md hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800">Refunded</CardTitle>
            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg">
              <X className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              ${totals.refunded.toFixed(2)}
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">{bookings.filter(b => b.paymentStatus === "reservation-refunded" || b.paymentStatus === "session-refunded").length} refunds</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 bg-gradient-to-br from-purple-50 via-purple-25 to-purple-50/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-800">Avg Booking Value</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-900">
              ${totals.avgBookingValue.toFixed(2)}
            </div>
            <p className="text-xs text-purple-600 mt-1 font-medium">Per booking</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => syncStripeMutation.mutate()}
            disabled={syncStripeMutation.isPending}
            className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncStripeMutation.isPending ? 'animate-spin' : ''}`} />
            Sync with Stripe
          </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 font-medium"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Stripe Dashboard
            </Button>
        </div>

        {/* Enhanced Filters */}
        <AdminCard className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-md dark:border-white/10 dark:bg-white/10">
          <AdminCardHeader>
            <AdminCardTitle className="text-[#0F0276] dark:text-white">Filter & Search</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-semibold text-slate-700">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Date</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
    <div>
              <Label htmlFor="status" className="text-sm font-semibold text-slate-700">Booking Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status" className="mt-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
      <SelectItem value="all">All Status</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="paid">Paid</SelectItem>
      <SelectItem value="confirmed">Confirmed</SelectItem>
      <SelectItem value="completed">Completed</SelectItem>
      <SelectItem value="failed">Failed</SelectItem>
      <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-status" className="text-sm font-semibold text-slate-700">Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger id="payment-status" className="mt-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                  <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                  <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                  <SelectItem value="session-paid">Session Paid</SelectItem>
                  <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                  <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </AdminCardContent>
        </AdminCard>

        {/* Enhanced Tabs for different views */}
        <AdminCard className="rounded-2xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md shadow-md dark:border-white/10 dark:bg-white/10">
          <AdminCardContent>
            <AdminContentTabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              items={[
                {
                  value: "overview",
                  label: "All Transactions",
                  activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
                },
                {
                  value: "pending",
                  label: "Pending Payments",
                  activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
                },
                {
                  value: "completed",
                  label: "Completed",
                  activeGradient: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D8BD2A] data-[state=active]:to-[#D8BD2A]/80 data-[state=active]:text-[#0F0276]",
                },
              ]}
              listClassName="bg-slate-100 text-[#0F0276] dark:bg-[#D8BD2A]/10 dark:text-white border-slate-200 dark:border-[#D8BD2A]/20 mb-4"
              triggerClassName="gap-2"
            >
            <TabsContent value="overview">
              {/* Mobile card list */}
              <div className="sm:hidden space-y-3 max-w-screen-sm mx-auto px-4">
                {filteredBookings.map((booking) => {
                  const totalPrice = getLessonPrice(booking);
                  let displayPaidAmount = 0;
                  let balanceDue = totalPrice;

                  if (booking.paymentStatus === "session-paid") {
                    displayPaidAmount = totalPrice;
                    balanceDue = 0;
                  } else if (booking.paymentStatus === "reservation-paid") {
                    displayPaidAmount = parseFloat(booking.paidAmount || "0");
                    if (displayPaidAmount <= 0) displayPaidAmount = 0.0;
                    balanceDue = totalPrice - displayPaidAmount;
                  } else if (
                    booking.paymentStatus === "reservation-pending" ||
                    booking.paymentStatus === "reservation-failed" ||
                    booking.paymentStatus === "unpaid"
                  ) {
                    displayPaidAmount = 0;
                    balanceDue = totalPrice;
                  } else if (
                    booking.paymentStatus === "reservation-refunded" ||
                    booking.paymentStatus === "session-refunded"
                  ) {
                    displayPaidAmount = 0;
                    balanceDue = 0;
                  }
                  if (balanceDue < 0) balanceDue = 0;

                  return (
                    <Card key={booking.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-sm sm:shadow-md">
                      <CardContent className="p-3 sm:p-5">
                        <div className="relative min-h-40 pb-20">
                          {/* Actions stack */}
                          <div className="absolute right-2 top-2 flex flex-col gap-2 z-10">
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => window.open(`https://dashboard.stripe.com/payments?query=${booking.parentEmail}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="hidden sm:inline">Stripe</span>
                            </AdminButton>
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => setSelectedBookingForDetails(booking)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Details</span>
                            </AdminButton>
                          </div>

                          {/* Content */}
                          <div className="pr-20">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900 text-base sm:text-xl leading-snug tracking-tight">
                                  {formatDate(booking.preferredDate || '')}{booking.preferredTime ? ` • ${booking.preferredTime}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-slate-300 text-xs px-2 py-0.5">
                                {typeof booking.status === 'object' && booking.status !== null ? JSON.stringify(booking.status) : booking.status}
                              </Badge>
                              <Badge variant="outline" className="border-slate-300 text-xs px-2 py-0.5">
                                {booking.paymentStatus || 'unpaid'}
                              </Badge>
                            </div>

                            <div className="mt-2 text-sm text-slate-800">
                              <div className="font-medium">
                                {typeof booking.lessonType === 'object' && booking.lessonType !== null
                                  ? getNameOrDescription(booking.lessonType)
                                  : booking.lessonType}
                              </div>
                              <div className="text-slate-600 line-clamp-1">
                                {booking.athlete1Name}{booking.athlete2Name ? ` & ${booking.athlete2Name}` : ''}
                              </div>
                              <div className="text-slate-600 line-clamp-2">
                                {booking.parentFirstName} {booking.parentLastName} · {booking.parentEmail}
                              </div>
                            </div>

                            {/* Amounts compact pills */}
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-md bg-slate-50 px-2.5 py-1.5">
                                <div className="text-slate-500">Total</div>
                                <div className="font-semibold text-slate-900 text-sm">${totalPrice.toFixed(2)}</div>
                              </div>
                              <div className="rounded-md bg-green-50 px-2.5 py-1.5">
                                <div className="text-green-700">Paid</div>
                                <div className="font-semibold text-green-700 text-sm">${displayPaidAmount.toFixed(2)}</div>
                              </div>
                              <div className="rounded-full bg-amber-50 px-3 py-1.5 text-center font-semibold text-amber-800 self-center">
                                Balance ${balanceDue.toFixed(2)}
                              </div>
                            </div>

                            {/* Payment status control */}
                            <div className="mt-3">
                              <Label className="text-xs text-slate-600">Payment Status</Label>
                              <Select
                                value={booking.paymentStatus || "unpaid"}
                                onValueChange={(value) => updatePaymentStatusMutation.mutate({ id: booking.id, paymentStatus: value })}
                              >
                                <SelectTrigger className="h-10 w-full text-sm rounded-lg border-slate-300 focus:border-blue-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unpaid">Unpaid</SelectItem>
                                  <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                                  <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                                  <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                                  <SelectItem value="session-paid">Session Paid</SelectItem>
                                  <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                                  <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-100">
                <Table className="border-separate border-spacing-y-2">
                  <TableHeader>
                    <TableRow className="border-transparent">
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Date</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Booking Details</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Parent</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Total Amount</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Paid Amount</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Balance Due</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Payment Status</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking, index) => {
                      const totalPrice = getLessonPrice(booking);
                      let displayPaidAmount = 0;
                      let balanceDue = totalPrice;

                      if (booking.paymentStatus === "session-paid") {
                        displayPaidAmount = totalPrice;
                        balanceDue = 0;
                      } else if (booking.paymentStatus === "reservation-paid") {
                        // Use paidAmount if present and > 0, otherwise default to $0
                        displayPaidAmount = parseFloat(booking.paidAmount || "0");
                        if (displayPaidAmount <= 0) displayPaidAmount = 0.00;
                        balanceDue = totalPrice - displayPaidAmount;
                      } else if (booking.paymentStatus === "reservation-pending" || booking.paymentStatus === "reservation-failed" || booking.paymentStatus === "unpaid") {
                        displayPaidAmount = 0;
                        balanceDue = totalPrice;
                      } else if (booking.paymentStatus === "reservation-refunded" || booking.paymentStatus === "session-refunded") {
                        displayPaidAmount = 0;
                        balanceDue = 0;
                      }

                      // Never show negative balance due
                      if (balanceDue < 0) balanceDue = 0;

                      return (
                        <TableRow 
                          key={booking.id}
                          className="transition-colors border-transparent"
                        >
                          <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[#0F0276] dark:text-white">
                                {formatDate(booking.preferredDate || '')}
                              </p>
                            <p className="text-xs text-[#0F0276]/90 dark:text-white/90">{booking.preferredTime}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="font-semibold text-[#0F0276] dark:text-white">
                              {typeof booking.lessonType === 'object' && booking.lessonType !== null
                                ? getNameOrDescription(booking.lessonType)
                                : booking.lessonType}
                            </p>
                            <p className="text-sm text-[#0F0276]/90 dark:text-white/90">
                              {booking.athlete1Name}
                              {booking.athlete2Name && ` & ${booking.athlete2Name}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#0F0276] dark:text-white">{booking.parentFirstName} {booking.parentLastName}</p>
                            <p className="text-xs text-[#0F0276]/90 dark:text-white/90">{booking.parentEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-[#0F0276] dark:text-white font-semibold">${totalPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent text-green-700 dark:text-green-400 font-semibold">${displayPaidAmount.toFixed(2)}</TableCell>
                        <TableCell className={`py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent font-semibold ${balanceDue > 0 ? "text-orange-600 dark:text-orange-400" : "text-[#0F0276]/80 dark:text-white/80"}`}>
                          ${balanceDue.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                            {typeof booking.status === 'object' && booking.status !== null ? JSON.stringify(booking.status) : booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Select
                            value={booking.paymentStatus || "unpaid"}
                            onValueChange={(value) => 
                              updatePaymentStatusMutation.mutate({ 
                                id: booking.id, 
                                paymentStatus: value 
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-[160px] rounded-lg bg-transparent text-[#0F0276] border-[#0F0276]/30 focus:border-[#0F0276] focus:ring-[#0F0276] dark:text-white dark:border-white/40 dark:focus:border-white dark:focus:ring-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                              <SelectItem value="reservation-pending">Reservation: Pending</SelectItem>
                              <SelectItem value="reservation-failed">Reservation: Failed</SelectItem>
                              <SelectItem value="reservation-paid">Reservation: Paid</SelectItem>
                              <SelectItem value="session-paid">Session Paid</SelectItem>
                              <SelectItem value="reservation-refunded">Reservation: Refunded</SelectItem>
                              <SelectItem value="session-refunded">Session: Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBookingForDetails(booking)}
                              className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium"
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://dashboard.stripe.com/payments?query=${booking.parentEmail}`, '_blank')}
                              className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10 font-medium"
                            >
                              View Stripe
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Pending Payments Tab */}
            <TabsContent value="pending">
              <div className="space-y-3 sm:space-y-5">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-xl p-3 sm:p-5 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1 text-base sm:text-xl leading-snug tracking-tight">Pending Session Payments</h4>
                      <p className="text-sm text-orange-800 leading-snug">
                        These bookings have paid the reservation fee but still owe the remaining balance at the time of the lesson.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Mobile card list */}
                <div className="sm:hidden space-y-3 max-w-screen-sm mx-auto px-4">
                  {pendingPayments.map((payment) => (
                    <Card key={payment.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-sm sm:shadow-md">
                      <CardContent className="p-3 sm:p-5">
                        <div className="relative min-h-40 pb-20">
                          {/* Actions stack */}
                          <div className="absolute right-2 top-2 flex flex-col gap-2 z-10">
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => {
                                const currentStatus = payment.paymentStatus;
                                let newStatus = PaymentStatusEnum.SESSION_PAID;
                                if (currentStatus === "reservation-failed" || currentStatus === "reservation-pending") {
                                  newStatus = PaymentStatusEnum.RESERVATION_PAID;
                                } else if (currentStatus === "reservation-paid") {
                                  newStatus = PaymentStatusEnum.SESSION_PAID;
                                }
                                updatePaymentStatusMutation.mutate({ id: payment.id, paymentStatus: newStatus });
                              }}
                              disabled={updatePaymentStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                              <span className="hidden sm:inline">Mark Paid</span>
                            </AdminButton>
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => window.open(`https://dashboard.stripe.com/payments?query=${payment.parentEmail}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="hidden sm:inline">Stripe</span>
                            </AdminButton>
                          </div>

                          <div className="pr-20">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900 text-base sm:text-xl leading-snug tracking-tight">{formatDate(payment.preferredDate || '')}{payment.preferredTime ? ` • ${payment.preferredTime}` : ''}</div>
                              </div>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-slate-300 text-xs px-2 py-0.5">
                                {typeof payment.lessonType === 'object' && payment.lessonType !== null
                                  ? getNameOrDescription(payment.lessonType)
                                  : payment.lessonType}
                              </Badge>
                            </div>

                            <div className="mt-2 text-sm text-slate-800">
                              <div className="text-slate-600 line-clamp-1">
                                {payment.athlete1Name}{payment.athlete2Name ? ` & ${payment.athlete2Name}` : ''}
                              </div>
                              <div className="text-slate-600 line-clamp-2">
                                {payment.parentFirstName} {payment.parentLastName} · {payment.parentPhone}
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-md bg-slate-50 px-2.5 py-1.5">
                                <div className="text-slate-500">Total</div>
                                <div className="font-semibold text-slate-900 text-sm">${payment.totalPrice.toFixed(2)}</div>
                              </div>
                              <div className="rounded-md bg-green-50 px-2.5 py-1.5">
                                <div className="text-green-700">Resv Paid</div>
                                <div className="font-semibold text-green-700 text-sm">${payment.paidAmount.toFixed(2)}</div>
                              </div>
                              <div className="rounded-full bg-amber-50 px-3 py-1.5 text-center font-semibold text-amber-800 self-center">
                                Balance ${payment.remainingBalance.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto rounded-lg border border-orange-100">
                  <Table className="border-separate border-spacing-y-2">
                    <TableHeader>
                      <TableRow className="border-transparent">
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Session Date</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Athlete(s)</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Parent</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Lesson Type</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Total Price</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Reservation Paid</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Balance Due</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pendingPayments.map((payment, index) => (
                      <TableRow 
                        key={payment.id}
                        className="transition-colors border-transparent"
                      >
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="font-semibold text-[#0F0276] dark:text-white">
                              {formatDate(payment.preferredDate || '')}
                            </p>
                            <p className="text-sm text-[#0F0276]/90 dark:text-white/90">{payment.preferredTime}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <p className="text-sm font-medium text-[#0F0276] dark:text-white">
                            {payment.athlete1Name}
                            {payment.athlete2Name && ` & ${payment.athlete2Name}`}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#0F0276] dark:text-white">{payment.parentFirstName} {payment.parentLastName}</p>
                            <p className="text-xs text-[#0F0276]/90 dark:text-white/90">{payment.parentPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10 font-medium">
                            {typeof payment.lessonType === 'object' && payment.lessonType !== null
                              ? getNameOrDescription(payment.lessonType)
                              : payment.lessonType}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-semibold">${payment.totalPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent text-green-700 dark:text-green-400 font-semibold">
                          ${payment.paidAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:border-transparent text-orange-600 dark:text-orange-400 font-bold">
                          ${payment.remainingBalance.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              const currentStatus = payment.paymentStatus;
                              let newStatus = PaymentStatusEnum.SESSION_PAID;
                              
                              // Dynamic button behavior based on current payment status
                              if (currentStatus === "reservation-failed" || currentStatus === "reservation-pending") {
                                newStatus = PaymentStatusEnum.RESERVATION_PAID;
                              } else if (currentStatus === "reservation-paid") {
                                newStatus = PaymentStatusEnum.SESSION_PAID;
                              }
                              
                              updatePaymentStatusMutation.mutate({ 
                                id: payment.id, 
                                paymentStatus: newStatus 
                              });
                            }}
                            disabled={updatePaymentStatusMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {payment.paymentStatus === "reservation-failed" || payment.paymentStatus === "reservation-pending" 
                              ? "Mark Reservation Paid" 
                              : "Mark Session Paid"
                            }
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-12">
                          <div className="flex flex-col items-center space-y-2">
                            <Check className="h-12 w-12 text-green-500" />
                            <p className="font-medium">No pending session payments</p>
                            <p className="text-sm">All payments are up to date!</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed">
              {/* Mobile card list */}
              <div className="sm:hidden space-y-3 max-w-screen-sm mx-auto px-4">
                {completedArchived.map((booking) => (
                  <Card key={booking.id} className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-sm sm:shadow-md">
                    <CardContent className="p-3 sm:p-5">
                      <div className="relative min-h-40 pb-20">
                        {/* Actions stack */}
                        <div className="absolute right-2 top-2 flex flex-col gap-2 z-10">
                          <AdminButton
                            variant="secondary"
                            size="sm"
                            className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                            onClick={() => setSelectedBookingForDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                          </AdminButton>
                          {booking.parentEmail && (
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              className="h-10 w-10 sm:w-28 sm:px-3 text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => window.open(`https://dashboard.stripe.com/payments?query=${booking.parentEmail}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="hidden sm:inline">Stripe</span>
                            </AdminButton>
                          )}
                        </div>
                        <div className="pr-20">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900 text-base sm:text-xl leading-snug tracking-tight">{booking.updatedAt ? formatDate(booking.updatedAt.toString().split('T')[0]) : 'N/A'}</div>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-slate-300 text-xs px-2 py-0.5">
                              {typeof booking.bookingMethod === 'object' && booking.bookingMethod !== null
                                ? getNameOrDescription(booking.bookingMethod)
                                : booking.bookingMethod}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-slate-800">
                            <div className="font-medium">
                              {typeof booking.lessonType === 'object' && booking.lessonType !== null
                                ? getNameOrDescription(booking.lessonType)
                                : booking.lessonType}
                            </div>
                            <div className="text-slate-600 line-clamp-1">
                              {booking.athlete1Name}{booking.athlete2Name ? ` & ${booking.athlete2Name}` : ''}
                            </div>
                            <div className="text-slate-600 line-clamp-2">
                              {booking.parentFirstName} {booking.parentLastName} · {booking.parentEmail}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900">Amount ${getLessonPrice(booking).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Desktop table */}
              <Table className="hidden sm:table border-separate border-spacing-y-2">
                <TableHeader>
                  <TableRow className="border-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Completion Date</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Lesson Details</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Parent</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Amount</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Payment Method</TableHead>
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#0F0276] dark:text-white uppercase tracking-wider bg-transparent">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                    <TableBody>
                  {completedArchived
                    .map((booking) => (
                      <TableRow key={booking.id} className="transition-colors border-transparent">
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          {booking.updatedAt ? formatDate(booking.updatedAt.toString().split('T')[0]) : 'N/A'}
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="font-medium text-[#0F0276] dark:text-white">
                              {typeof booking.lessonType === 'object' && booking.lessonType !== null
                                ? getNameOrDescription(booking.lessonType)
                                : booking.lessonType}
                            </p>
                            <p className="text-sm text-[#0F0276]/90 dark:text-white/90">
                              {booking.athlete1Name}
                              {booking.athlete2Name && ` & ${booking.athlete2Name}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <div className="space-y-1">
                            <p className="text-sm text-[#0F0276] dark:text-white">{booking.parentFirstName} {booking.parentLastName}</p>
                            <p className="text-xs text-[#0F0276]/90 dark:text-white/90">{booking.parentEmail}</p>
                          </div>
                        </TableCell>
                            <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent font-medium">
                              ${getLessonPrice(booking).toFixed(2)}
                            </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Badge variant="outline" className="border-[#0F0276]/30 text-[#0F0276] bg-[#0F0276]/5 dark:border-white/40 dark:text-white dark:bg-white/10">
                            {typeof booking.bookingMethod === 'object' && booking.bookingMethod !== null
                              ? getNameOrDescription(booking.bookingMethod)
                              : booking.bookingMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md text-[#0F0276] border border-slate-200/60 first:rounded-l-xl last:rounded-r-xl dark:bg-[#2A4A9B] dark:text-white dark:border-transparent">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBookingForDetails(booking)}
                            className="text-[#0F0276] border-[#0F0276]/40 hover:bg-[#0F0276]/10 dark:text-white dark:border-white/60 dark:hover:bg-white/10"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </AdminContentTabs>
          </AdminCardContent>
        </AdminCard>
      </div>
      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBookingForDetails}
        isOpen={!!selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        onOpenStripe={(booking) => {
          const s = (booking as any)?.stripeSessionId;
          if (s) {
            window.open(`https://dashboard.stripe.com/checkout/sessions/${s}`, '_blank');
          } else {
            window.open(`https://dashboard.stripe.com/payments?query=${booking.parentEmail}` , '_blank');
          }
        }}
      />
    </>
  );
}