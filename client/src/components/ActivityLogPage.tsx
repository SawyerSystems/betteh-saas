import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, RotateCcw, Calendar, User, Activity, Target, Clock, AlertCircle } from 'lucide-react';
import { ActivityActorType, ActivityActionType, ActivityCategory, ActivityTargetType, type ActivityLog } from '../../../shared/schema';

interface ActivityLogPageProps {}

interface ActivityLogFilters {
  search: string;
  actorType: ActivityActorType | '';
  actionCategory: ActivityCategory | '';
  targetType: ActivityTargetType | '';
  startDate: string;
  endDate: string;
}

interface ActivityLogResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ActivityLogPage({}: ActivityLogPageProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<ActivityLogFilters>({
    search: '',
    actorType: '',
    actionCategory: '',
    targetType: '',
    startDate: '',
    endDate: ''
  });

  const limit = 50;

  // Fetch activity logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to params
      if (filters.search) params.append('search', filters.search);
      if (filters.actorType) params.append('actorType', filters.actorType);
      if (filters.actionCategory) params.append('actionCategory', filters.actionCategory);
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (response.ok) {
        const data: ActivityLogResponse = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        console.error('Failed to fetch activity logs');
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = (key: keyof ActivityLogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      actorType: '',
      actionCategory: '',
      targetType: '',
      startDate: '',
      endDate: ''
    });
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({ format });
      
      // Add current filters to export
      if (filters.search) params.append('search', filters.search);
      if (filters.actorType) params.append('actorType', filters.actorType);
      if (filters.actionCategory) params.append('actionCategory', filters.actionCategory);
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/activity-logs/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const reverseActivity = async (activityId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/activity-logs/${activityId}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchLogs(); // Refresh the list
        alert('Activity reversed successfully');
      } else {
        alert('Failed to reverse activity');
      }
    } catch (error) {
      console.error('Error reversing activity:', error);
      alert('Error reversing activity');
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return <Activity className="w-4 h-4 text-green-500" />;
      case 'updated': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'deleted': return <Activity className="w-4 h-4 text-red-500" />;
      case 'status_changed': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'payment_captured': return <Activity className="w-4 h-4 text-green-600" />;
      case 'payment_refunded': return <Activity className="w-4 h-4 text-orange-500" />;
      case 'email_sent': return <Activity className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const isUndoable = (log: ActivityLog): boolean => {
    // Define which actions can be undone
    const undoableActions = [
      'no_show_marked',
      'status_changed',
      'availability_added',
      'availability_removed'
    ];
    return undoableActions.includes(log.actionType) && !log.isReversed;
  };

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600">
            Track all system activities and changes ({total.toLocaleString()} total entries)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLogs('csv')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportLogs('json')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities, actors, or targets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actor Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.actorType}
                onChange={(e) => handleFilterChange('actorType', e.target.value)}
              >
                <option value="">All Actor Types</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.actionCategory}
                onChange={(e) => handleFilterChange('actionCategory', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="booking">Booking</option>
                <option value="athlete">Athlete</option>
                <option value="parent">Parent</option>
                <option value="payment">Payment</option>
                <option value="waiver">Waiver</option>
                <option value="schedule">Schedule</option>
                <option value="communication">Communication</option>
                <option value="progress">Progress</option>
                <option value="admin">Admin</option>
                <option value="auth">Auth</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
              >
                <option value="">All Target Types</option>
                <option value="booking">Booking</option>
                <option value="athlete">Athlete</option>
                <option value="parent">Parent</option>
                <option value="payment">Payment</option>
                <option value="waiver">Waiver</option>
                <option value="availability">Availability</option>
                <option value="skill">Skill</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-gray-500">
              {activeFiltersCount > 0 ? 'Try adjusting your filters.' : 'No activities have been logged yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timestamp
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Actor
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Action
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Target
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.actorType === 'admin' ? 'bg-blue-100 text-blue-800' :
                            log.actorType === 'parent' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.actorType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{log.actorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.actionType)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.actionType}</div>
                            <div className="text-sm text-gray-500">{log.actionCategory}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.targetIdentifier}</div>
                        <div className="text-sm text-gray-500">{log.targetType}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md">
                          {log.actionDescription}
                          {log.notes && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              Note: {log.notes}
                            </div>
                          )}
                          {log.isReversed && (
                            <div className="text-xs text-orange-600 mt-1 font-medium">
                              ⚠️ This action has been reversed
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isUndoable(log) && (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter reason for reversing this action (optional):');
                              if (reason !== null) { // User didn't cancel
                                reverseActivity(log.id, reason || undefined);
                              }
                            }}
                            className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                            title="Reverse this action"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                      <span className="font-medium">{total}</span> results
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
