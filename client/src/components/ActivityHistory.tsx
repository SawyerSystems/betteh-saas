import React, { useState, useEffect } from 'react';
import { Clock, User, Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ActivityTargetType, type ActivityLog } from '../../../shared/schema';

interface ActivityHistoryProps {
  targetType: ActivityTargetType;
  targetId: number;
  targetName: string;
  limit?: number;
  className?: string;
}

export function ActivityHistory({ 
  targetType, 
  targetId, 
  targetName, 
  limit = 10,
  className = '' 
}: ActivityHistoryProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [targetType, targetId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/activity-logs/${targetType}/${targetId}?limit=${limit}`);
      if (response.ok) {
        const data: ActivityLog[] = await response.json();
        setLogs(data);
      } else {
        setError('Failed to fetch activity history');
      }
    } catch (error) {
      console.error('Error fetching activity history:', error);
      setError('Error loading activity history');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return <Activity className="w-3 h-3 text-green-500" />;
      case 'updated': return <Activity className="w-3 h-3 text-blue-500" />;
      case 'deleted': return <Activity className="w-3 h-3 text-red-500" />;
      case 'status_changed': return <Activity className="w-3 h-3 text-yellow-500" />;
      case 'payment_captured': return <Activity className="w-3 h-3 text-green-600" />;
      case 'payment_refunded': return <Activity className="w-3 h-3 text-orange-500" />;
      case 'email_sent': return <Activity className="w-3 h-3 text-purple-500" />;
      case 'no_show_marked': return <Activity className="w-3 h-3 text-red-400" />;
      case 'no_show_cleared': return <Activity className="w-3 h-3 text-green-400" />;
      case 'rescheduled': return <Activity className="w-3 h-3 text-blue-400" />;
      default: return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const getActorColor = (actorType: string) => {
    switch (actorType) {
      case 'admin': return 'text-blue-600';
      case 'parent': return 'text-green-600';
      case 'system': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const displayLogs = expanded ? logs : logs.slice(0, 5);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Activity History</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Activity History</h3>
        </div>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Activity History: {targetName}
          </h3>
          <span className="text-xs text-gray-500">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      <div className="p-4">
        {logs.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayLogs.map((log, index) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(log.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getActorColor(log.actorType)}`}>
                      {log.actorName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">
                      {formatTimestamp(log.createdAt)}
                    </span>
                    {log.isReversed && (
                      <span className="text-orange-600 text-xs font-medium">
                        (Reversed)
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700">
                    {log.actionDescription}
                  </p>
                  {log.notes && (
                    <p className="text-gray-500 text-xs mt-1 italic">
                      Note: {log.notes}
                    </p>
                  )}
                  {log.previousValue && log.newValue && (
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Changed:</span> {log.fieldChanged || 'value'}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                          {log.previousValue}
                        </span>
                        <span>→</span>
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                          {log.newValue}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {logs.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show {logs.length - 5} more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
