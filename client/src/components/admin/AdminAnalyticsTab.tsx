import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminAnalyticsMetrics, type MetricCard } from '@/components/admin-ui/AdminAnalyticsMetrics';
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from '@/components/admin-ui/AdminCard';
import { 
  Calendar, 
  Monitor, 
  User, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import type { Booking } from '@shared/schema';

interface AnalyticsTabProps {
  analyticsHeaderMetrics: MetricCard[];
  allBookings: Booking[];
  lessonTypes: any[];
  analyticsDateRange: { start: string; end: string };
  setAnalyticsDateRange: (range: { start: string; end: string } | ((prev: { start: string; end: string }) => { start: string; end: string })) => void;
  analyticsLessonType: string;
  setAnalyticsLessonType: (type: string) => void;
}

export default function AdminAnalyticsTab({
  analyticsHeaderMetrics,
  allBookings,
  lessonTypes,
  analyticsDateRange,
  setAnalyticsDateRange,
  analyticsLessonType,
  setAnalyticsLessonType
}: AnalyticsTabProps) {
  // Filter bookings based on current filters
  const filteredBookings = useMemo(() => {
    return allBookings.filter(booking => {
      // Date range filter
      if (analyticsDateRange.start && booking.preferredDate && booking.preferredDate < analyticsDateRange.start) return false;
      if (analyticsDateRange.end && booking.preferredDate && booking.preferredDate > analyticsDateRange.end) return false;
      
      // Lesson type filter
      if (analyticsLessonType !== 'all') {
        const lessonTypeName = (() => {
          const lt = booking.lessonType as any;
          if (lt && typeof lt === 'object' && 'name' in lt) return lt.name;
          if (typeof lt === 'string') return lt;
          return undefined;
        })();
        if (lessonTypeName !== analyticsLessonType) return false;
      }
      
      return true;
    });
  }, [allBookings, analyticsDateRange, analyticsLessonType]);

  // Booking method metrics
  const bookingMethodMetrics: MetricCard[] = useMemo(() => {
    const onlineBookingsCount = filteredBookings.filter(b => (b as any).bookingMethod === 'Website').length;
    const adminBookingsCount = filteredBookings.filter(b => (b as any).bookingMethod === 'Admin').length;
    const totalBookings = filteredBookings.length;

    const onlinePercentage = totalBookings > 0 ? Math.round((onlineBookingsCount / totalBookings) * 100) : 0;
    const adminPercentage = totalBookings > 0 ? Math.round((adminBookingsCount / totalBookings) * 100) : 0;

    return [
      {
        key: 'online-bookings',
        label: 'Online Bookings',
        value: `${onlinePercentage}%`,
        hint: 'Booked on website',
        icon: <Monitor className="h-4 w-4" />,
        color: 'blue'
      },
      {
        key: 'admin-bookings',
        label: 'Admin Booked',
        value: `${adminPercentage}%`,
        hint: 'Created by admin',
        icon: <User className="h-4 w-4" />,
        color: 'indigo'
      }
    ];
  }, [filteredBookings]);

  // Booking status distribution
  const statusMetrics: MetricCard[] = useMemo(() => {
    const statusCounts = filteredBookings.reduce((acc, booking) => {
      const status = booking.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredBookings.length;
    const completedRate = total > 0 ? Math.round(((statusCounts.completed || 0) / total) * 100) : 0;
    const cancelledRate = total > 0 ? Math.round(((statusCounts.cancelled || 0) + (statusCounts['no-show'] || 0)) / total * 100) : 0;

    return [
      {
        key: 'completion-rate',
        label: 'Completion Rate',
        value: `${completedRate}%`,
        hint: 'Sessions completed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'green'
      },
      {
        key: 'cancellation-rate',
        label: 'Cancellation Rate',
        value: `${cancelledRate}%`,
        hint: 'Cancelled + No-shows',
        icon: <XCircle className="h-4 w-4" />,
        color: 'red'
      }
    ];
  }, [filteredBookings]);

  // Revenue metrics
  const revenueMetrics: MetricCard[] = useMemo(() => {
    let totalRevenue = 0;
    let completedRevenue = 0;
    let pendingRevenue = 0;

    filteredBookings.forEach(booking => {
      const amount = Number(booking.amount) || 0;
      totalRevenue += amount;
      
      if (booking.status === 'completed') {
        completedRevenue += amount;
      } else if (booking.status === 'pending' || booking.status === 'confirmed') {
        pendingRevenue += amount;
      }
    });

    const avgRevenue = filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0;

    return [
      {
        key: 'total-revenue',
        label: 'Total Revenue',
        value: `$${totalRevenue.toLocaleString()}`,
        hint: 'All filtered bookings',
        icon: <DollarSign className="h-4 w-4" />,
        color: 'green'
      },
      {
        key: 'completed-revenue',
        label: 'Completed Revenue',
        value: `$${completedRevenue.toLocaleString()}`,
        hint: 'From completed sessions',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'green'
      },
      {
        key: 'pending-revenue',
        label: 'Pending Revenue',
        value: `$${pendingRevenue.toLocaleString()}`,
        hint: 'Upcoming sessions',
        icon: <Clock className="h-4 w-4" />,
        color: 'amber'
      },
      {
        key: 'avg-revenue',
        label: 'Avg Session Value',
        value: `$${avgRevenue.toFixed(0)}`,
        hint: 'Per booking',
        icon: <Target className="h-4 w-4" />,
        color: 'blue'
      }
    ];
  }, [filteredBookings]);

  // Customer insights
  const customerMetrics: MetricCard[] = useMemo(() => {
    const athleteIds = new Set<number>();
    const parentIds = new Set<number>();
    let multiAthleteBookings = 0;

    filteredBookings.forEach(booking => {
      if (booking.athletes && Array.isArray(booking.athletes)) {
        booking.athletes.forEach((athlete) => {
          if (athlete.athleteId) {
            athleteIds.add(athlete.athleteId);
          }
        });
        if (booking.athletes.length > 1) {
          multiAthleteBookings++;
        }
      }
      if (booking.parentId) {
        parentIds.add(booking.parentId);
      }
    });

    const multiAthleteRate = filteredBookings.length > 0 ? Math.round((multiAthleteBookings / filteredBookings.length) * 100) : 0;

    return [
      {
        key: 'unique-athletes',
        label: 'Unique Athletes',
        value: athleteIds.size.toString(),
        hint: 'Different athletes served',
        icon: <Users className="h-4 w-4" />,
        color: 'indigo'
      },
      {
        key: 'unique-families',
        label: 'Unique Families',
        value: parentIds.size.toString(),
        hint: 'Different families served',
        icon: <User className="h-4 w-4" />,
        color: 'indigo'
      },
      {
        key: 'multi-athlete-rate',
        label: 'Multi-Athlete Sessions',
        value: `${multiAthleteRate}%`,
        hint: 'Bookings with multiple kids',
        icon: <RefreshCw className="h-4 w-4" />,
        color: 'blue'
      }
    ];
  }, [filteredBookings]);

  // Time and day analytics
  const timeAnalytics = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    filteredBookings.forEach(booking => {
      if (booking.preferredDate) {
        const date = new Date(booking.preferredDate);
        const dayOfWeek = date.getDay();
        dayCounts[dayOfWeek]++;
      }
      
      if (booking.preferredTime) {
        const hour = parseInt(booking.preferredTime.split(':')[0]);
        if (hour >= 0 && hour < 24) {
          hourCounts[hour]++;
        }
      }
    });

    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    
    return {
      peakDay: dayNames[peakDay],
      peakHour: peakHour,
      hourCounts,
      dayCounts: dayCounts.map((count, index) => ({
        day: dayNames[index],
        count
      }))
    };
  }, [filteredBookings]);

  // Popular focus areas
  const focusAreaStats = useMemo(() => {
    const areaCount = new Map<string, number>();
    filteredBookings.forEach(booking => {
      if (booking.focusAreas && Array.isArray(booking.focusAreas)) {
        booking.focusAreas.forEach((area: string) => {
          areaCount.set(area, (areaCount.get(area) || 0) + 1);
        });
      }
    });
    return Array.from(areaCount.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [filteredBookings]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Key Metrics */}
      <AdminAnalyticsMetrics 
        metrics={analyticsHeaderMetrics} 
        columns={{ base: 2, sm: 3, lg: 4 }} 
      />
      
      {/* Revenue Analytics */}
      <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
        <AdminCardHeader className="pb-4">
          <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#D8BD2A]" />
            Revenue Analytics
          </AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminAnalyticsMetrics 
            metrics={revenueMetrics} 
            columns={{ base: 2, sm: 4, lg: 4 }}
          />
        </AdminCardContent>
      </AdminCard>

      {/* Booking Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
          <AdminCardHeader className="pb-4">
            <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D8BD2A]" />
              Booking Methods
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <AdminAnalyticsMetrics 
              metrics={bookingMethodMetrics} 
              columns={{ base: 1, sm: 2, lg: 2 }}
            />
          </AdminCardContent>
        </AdminCard>

        <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
          <AdminCardHeader className="pb-4">
            <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-[#D8BD2A]" />
              Booking Status
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <AdminAnalyticsMetrics 
              metrics={statusMetrics} 
              columns={{ base: 1, sm: 2, lg: 2 }}
            />
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* Customer Insights */}
      <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
        <AdminCardHeader className="pb-4">
          <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#D8BD2A]" />
            Customer Insights
          </AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminAnalyticsMetrics 
            metrics={customerMetrics} 
            columns={{ base: 1, sm: 3, lg: 3 }}
          />
        </AdminCardContent>
      </AdminCard>

      {/* Popular Focus Areas */}
      {focusAreaStats.length > 0 && (
        <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
          <AdminCardHeader className="pb-4">
            <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-[#D8BD2A]" />
              Popular Focus Areas
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {focusAreaStats.map((stat, index) => (
                <div key={stat.area} className="text-center p-4 bg-white/20 dark:bg-slate-800/20 rounded-lg">
                  <div className="text-lg font-bold text-[#0F0276] dark:text-white">
                    {stat.count}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.area}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    #{index + 1} most popular
                  </div>
                </div>
              ))}
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* Peak Times Analysis */}
      <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
        <AdminCardHeader className="pb-4">
          <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#D8BD2A]" />
            Peak Times Analysis
          </AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-3">Most Popular Day</h4>
              <div className="text-2xl font-bold text-[#0F0276] dark:text-white mb-2">
                {timeAnalytics.peakDay}
              </div>
              <div className="space-y-2">
                {timeAnalytics.dayCounts.map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{day.day}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-[#0F0276] dark:bg-[#D8BD2A] h-2 rounded"
                        style={{ 
                          width: `${Math.max(day.count * 40 / Math.max(...timeAnalytics.dayCounts.map(d => d.count)), 4)}px` 
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-white w-6">
                        {day.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-white mb-3">Peak Hour</h4>
              <div className="text-2xl font-bold text-[#0F0276] dark:text-white mb-2">
                {timeAnalytics.peakHour}:00
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Most bookings at {timeAnalytics.peakHour === 0 ? '12' : timeAnalytics.peakHour > 12 ? timeAnalytics.peakHour - 12 : timeAnalytics.peakHour}:00 {timeAnalytics.peakHour >= 12 ? 'PM' : 'AM'}
              </div>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>

      {/* Date Range + Filters */}
      <AdminCard className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-md">
        <AdminCardHeader className="pb-4">
          <AdminCardTitle className="text-[#0F0276] dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#D8BD2A]" />
            Filters
          </AdminCardTitle>
        </AdminCardHeader>
        <AdminCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-white">Start Date</Label>
              <Input
                type="date"
                value={analyticsDateRange.start}
                onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="rounded-lg border-0 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#0F0276] dark:focus:ring-[#D8BD2A] transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-white">End Date</Label>
              <Input
                type="date"
                value={analyticsDateRange.end}
                onChange={(e) => setAnalyticsDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="rounded-lg border-0 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#0F0276] dark:focus:ring-[#D8BD2A] transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-white">Lesson Type</Label>
              <Select value={analyticsLessonType} onValueChange={setAnalyticsLessonType}>
                <SelectTrigger className="rounded-lg border-0 bg-slate-50 dark:bg-slate-800 dark:text-white">
                  <SelectValue placeholder="All lesson types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lesson Types</SelectItem>
                  {(lessonTypes || []).map((lt: any) => (
                    <SelectItem key={lt.id} value={lt.name}>{lt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full bg-white dark:bg-[#0F0276] border-0 dark:border-[#2A4A9B] shadow-md hover:shadow-lg transition-all duration-200 rounded-lg dark:text-white"
                onClick={() => {
                  setAnalyticsDateRange({ start: '', end: '' });
                  setAnalyticsLessonType('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
