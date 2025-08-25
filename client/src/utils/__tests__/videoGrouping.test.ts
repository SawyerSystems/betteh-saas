import { describe, it, expect } from 'vitest';
import { 
  getLocalDayKey, 
  formatDateLabel, 
  groupVideosByDay, 
  getVisibleGroups, 
  shouldShowSeeMore,
  type VideoItem 
} from '@/utils/videoGrouping';

describe('videoGrouping utils', () => {
  describe('getLocalDayKey', () => {
    it('should return correct day key for valid timestamp', () => {
      const video: VideoItem = {
        id: 1,
        recordedAt: '2025-08-15T14:30:00Z'
      };
      
      // Note: This will use local timezone, so we test the format rather than exact date
      const result = getLocalDayKey(video);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return Unknown for missing timestamp', () => {
      const video: VideoItem = { id: 1 };
      expect(getLocalDayKey(video)).toBe('Unknown');
    });

    it('should return Unknown for invalid timestamp', () => {
      const video: VideoItem = {
        id: 1,
        recordedAt: 'invalid-date'
      };
      expect(getLocalDayKey(video)).toBe('Unknown');
    });
  });

  describe('formatDateLabel', () => {
    it('should format valid day key correctly', () => {
      const result = formatDateLabel('2025-08-15');
      expect(result).toMatch(/Aug \d{1,2}, 2025/);
    });

    it('should handle Unknown day key', () => {
      expect(formatDateLabel('Unknown')).toBe('Unknown Date');
    });

    it('should handle invalid day key', () => {
      const result = formatDateLabel('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('groupVideosByDay', () => {
    it('should group videos by day correctly', () => {
      const videos: VideoItem[] = [
        { id: 1, recordedAt: '2025-08-15T10:00:00Z', title: 'Video 1' },
        { id: 2, recordedAt: '2025-08-15T14:00:00Z', title: 'Video 2' },
        { id: 3, recordedAt: '2025-08-14T10:00:00Z', title: 'Video 3' },
      ];

      const groups = groupVideosByDay(videos);
      
      // Should have 2 groups (2 different days)
      expect(groups).toHaveLength(2);
      
      // Groups should be sorted by date descending (newest first)
      expect(groups[0].dayKey > groups[1].dayKey).toBe(true);
      
      // Videos within each day should be sorted by time descending
      const aug15Group = groups.find(g => g.dayKey.includes('08-15'));
      expect(aug15Group).toBeDefined();
      expect(aug15Group!.videos).toHaveLength(2);
      expect(aug15Group!.videos[0].id).toBe(2); // 14:00 should come before 10:00
      expect(aug15Group!.coverVideo.id).toBe(2); // Newest video is cover
    });

    it('should handle empty video array', () => {
      expect(groupVideosByDay([])).toEqual([]);
    });

    it('should handle videos with Unknown dates', () => {
      const videos: VideoItem[] = [
        { id: 1, title: 'Video 1' }, // No recordedAt
        { id: 2, recordedAt: '2025-08-15T10:00:00Z', title: 'Video 2' },
      ];

      const groups = groupVideosByDay(videos);
      expect(groups).toHaveLength(2);
      
      // Unknown should be last
      expect(groups[groups.length - 1].dayKey).toBe('Unknown');
    });
  });

  describe('getVisibleGroups', () => {
    it('should return at most 2 groups', () => {
      const groups = [
        { dayKey: '2025-08-15', dateLabel: 'Aug 15, 2025', videos: [], coverVideo: { id: 1 } },
        { dayKey: '2025-08-14', dateLabel: 'Aug 14, 2025', videos: [], coverVideo: { id: 2 } },
        { dayKey: '2025-08-13', dateLabel: 'Aug 13, 2025', videos: [], coverVideo: { id: 3 } },
      ];

      const visible = getVisibleGroups(groups);
      expect(visible).toHaveLength(2);
      expect(visible[0].dayKey).toBe('2025-08-15');
      expect(visible[1].dayKey).toBe('2025-08-14');
    });

    it('should return all groups if less than 3', () => {
      const groups = [
        { dayKey: '2025-08-15', dateLabel: 'Aug 15, 2025', videos: [], coverVideo: { id: 1 } },
      ];

      const visible = getVisibleGroups(groups);
      expect(visible).toHaveLength(1);
    });
  });

  describe('shouldShowSeeMore', () => {
    it('should return true when more than 2 groups', () => {
      const groups = [
        { dayKey: '2025-08-15', dateLabel: 'Aug 15, 2025', videos: [], coverVideo: { id: 1 } },
        { dayKey: '2025-08-14', dateLabel: 'Aug 14, 2025', videos: [], coverVideo: { id: 2 } },
        { dayKey: '2025-08-13', dateLabel: 'Aug 13, 2025', videos: [], coverVideo: { id: 3 } },
      ];

      expect(shouldShowSeeMore(groups)).toBe(true);
    });

    it('should return false when 2 or fewer groups', () => {
      const groups = [
        { dayKey: '2025-08-15', dateLabel: 'Aug 15, 2025', videos: [], coverVideo: { id: 1 } },
        { dayKey: '2025-08-14', dateLabel: 'Aug 14, 2025', videos: [], coverVideo: { id: 2 } },
      ];

      expect(shouldShowSeeMore(groups)).toBe(false);
    });
  });
});
