
/// <reference types="vite/client" />

import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Clock, Instagram, Youtube, MessageCircle, Facebook } from "lucide-react";
import cwtLogo from "/assets/betteh_logo_black_font.png";

interface HourSchedule {
  available: boolean;
  start: string;
  end: string;
}

interface SiteHours {
  [key: string]: HourSchedule;
}

export function Footer() {
  // Ordered days array for consistent display
  const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch dynamic site content
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch admin schedule availability to reflect real schedule in footer
  const { data: availability } = useQuery({
    queryKey: ['/api/availability'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/availability');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const contact = siteContent?.contact || {
    phone: '(585) 755-8122',
    email: 'Admin@coachwilltumbles.com',
    address: {
      name: 'Oceanside Gymnastics',
      street: '1935 Ave. del Oro #A',
      city: 'Oceanside',
      state: 'CA',
      zip: '92056'
    }
  };

  // Helpers to normalize time strings
  const toHHMM = (time: string) => {
    if (!time) return '';
    // Handle HH:MM:SS
    const parts = time.split(':');
    if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    return time;
  };
  const from12hToHHMM = (time: string) => {
    if (!time) return '';
    const m = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!m) return time;
    let h = parseInt(m[1], 10);
    const mm = m[2] ?? '00';
    const ap = m[3].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${mm}`;
  };

  // Build weekly hours from availability (admin schedule). If multiple slots per day, show earliest start → latest end.
  const buildHoursFromAvailability = (): SiteHours | null => {
    if (!Array.isArray(availability) || availability.length === 0) return null;
    const byDay: Record<number, { starts: string[]; ends: string[]; anyAvailable: boolean }> = {};
    for (let i = 0; i < 7; i++) byDay[i] = { starts: [], ends: [], anyAvailable: false };
    for (const slot of availability as Array<any>) {
      const dow: number = slot.dayOfWeek ?? slot.day_of_week;
      if (dow == null) continue;
      const start = toHHMM(String(slot.startTime ?? slot.start_time ?? ''));
      const end = toHHMM(String(slot.endTime ?? slot.end_time ?? ''));
      const isAvail = (slot.isAvailable ?? slot.is_available ?? true) === true;
      if (!start || !end) continue;
      byDay[dow].starts.push(start);
      byDay[dow].ends.push(end);
      if (isAvail) byDay[dow].anyAvailable = true;
    }
    const dayNames: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    const result: SiteHours = {};
    for (let i = 0; i < 7; i++) {
      const name = dayNames[i];
      const starts = byDay[i].starts.sort();
      const ends = byDay[i].ends.sort();
      const available = byDay[i].anyAvailable && starts.length > 0 && ends.length > 0;
      result[name] = {
        available,
        start: available ? starts[0] : '',
        end: available ? ends[ends.length - 1] : ''
      };
    }
    return result;
  };

  // Fallback: normalize site-content hours (supports both lowercase day keys and nested hours.hours shape, 12h or 24h)
  const buildHoursFromSiteContent = (): SiteHours | null => {
    const scHours = siteContent?.hours;
    if (!scHours) return null;
    const source: any = scHours.hours ?? scHours; // Accept either shape
    const result: SiteHours = {};
    for (const day of orderedDays) {
      const lower = day.toLowerCase();
      const entry = source[day] || source[lower];
      if (entry) {
        const rawStart = String(entry.start ?? '');
        const rawEnd = String(entry.end ?? '');
        const start = toHHMM(from12hToHHMM(rawStart));
        const end = toHHMM(from12hToHHMM(rawEnd));
        result[day] = {
          available: Boolean(entry.available) && !!start && !!end,
          start,
          end,
        };
      } else {
        result[day] = { available: false, start: '', end: '' };
      }
    }
    return result;
  };

  const hours: SiteHours =
    buildHoursFromAvailability() ||
    buildHoursFromSiteContent() ||
    {
      Monday: { available: true, start: '09:00', end: '16:00' },
      Tuesday: { available: true, start: '09:00', end: '15:30' },
      Wednesday: { available: true, start: '09:00', end: '16:00' },
      Thursday: { available: true, start: '09:00', end: '15:30' },
      Friday: { available: true, start: '09:00', end: '16:00' },
      Saturday: { available: true, start: '10:00', end: '14:00' },
      Sunday: { available: false, start: '', end: '' }
    };

  // Convert 24-hour format to 12-hour format for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${period}`;
  };

  return (
    <footer className="relative overflow-hidden theme-smooth bg-gray-50 dark:bg-gray-900">
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-[0.02]">
        <img 
          src={cwtLogo} 
          alt="Betteh Background" 
          className="w-96 h-96 object-contain dark:invert"
        />
      </div>
      
  <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header Section with Logo and Description */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src={cwtLogo} 
              alt="Betteh" 
              className="w-12 h-12"
            />
            <h3 className="text-lg font-bold">
              <span className="text-blue-600">BETT</span>
              <span className="text-green-600">EH</span>
            </h3>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            The complete coaching business management platform. Streamline bookings, track athlete progress, and grow your coaching business with intelligent tools designed for modern coaches.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-colors" aria-label="Facebook">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-[#E4405F] dark:hover:text-[#E4405F] transition-colors" aria-label="Instagram">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-[#FF0000] dark:hover:text-[#FF0000] transition-colors" aria-label="YouTube">
              <Youtube className="w-6 h-6" />
            </a>
            <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-[#FF0050] dark:hover:text-[#FF0050] transition-colors" aria-label="TikTok">
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Main Footer Content - Horizontal Layout */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          {/* Left Side - Quick Links and Lesson Types */}
          <div className="flex flex-col md:flex-row md:space-x-12 lg:space-x-16 space-y-8 md:space-y-0">
            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/booking" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Private Lessons</Link></li>
                <li><Link href="/about" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
                <li><Link href="/tips" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tips & Drills</Link></li>
                <li><Link href="/contact" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Lesson Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Lesson Types</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-slate-700 dark:text-slate-300">Quick Journey (30 min)</span></li>
                <li><span className="text-slate-700 dark:text-slate-300">Dual Quest | Semi-Private (30 min)</span></li>
                <li><span className="text-slate-700 dark:text-slate-300">Deep Dive (60 min)</span></li>
                <li><span className="text-slate-700 dark:text-slate-300">Partner Progression | Semi-Private (60 min)</span></li>
              </ul>
            </div>
          </div>

          {/* Right Side - Contact Us */}
          <div className="space-y-4 lg:text-right lg:flex-shrink-0">
            <h3 className="text-lg font-semibold text-teal-600 dark:text-teal-400">Contact Us</h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2 lg:justify-end">
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center space-x-2 lg:justify-end">
                <Mail className="w-4 h-4" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center space-x-2 lg:justify-end">
                <MapPin className="w-4 h-4" />
                <div className="lg:text-right">
                  {contact.address.name}<br />
                  {contact.address.street}<br />
                  {contact.address.city}, {contact.address.state} {contact.address.zip}
                </div>
              </div>
              <div className="flex items-center space-x-2 lg:justify-end">
                <Clock className="w-4 h-4" />
                <div className="lg:text-right">
                  {orderedDays.map((day) => {
                    const schedule = hours[day];
                    const shortDay = day.slice(0, 3);
                    
                    if (!schedule?.available) {
                      return (
                        <div key={day} className="text-xs">
                          {shortDay}: Ask about availability
                        </div>
                      );
                    }
                    
                    return (
                      <div key={day} className="text-xs">
                        {shortDay}: {formatTime(schedule.start)} – {formatTime(schedule.end)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2025 Betteh. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
              <Link href="/privacy-requests" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Requests</Link>
              <button
                type="button"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => document.dispatchEvent(new CustomEvent('open-cookie-settings'))}
              >Cookie Settings</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
