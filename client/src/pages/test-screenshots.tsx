import React, { useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Star, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Play,
  Award,
  Bell,
  CreditCard,
  Shield,
  Phone,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

// Test data for realistic screenshots
const mockAthletes = [
  { id: 1, name: "Emma Rodriguez", age: 8, level: "Beginner", avatarColor: "bg-pink-500" },
  { id: 2, name: "Noah Chen", age: 10, level: "Intermediate", avatarColor: "bg-blue-500" },
  { id: 3, name: "Sophia Kim", age: 12, level: "Advanced", avatarColor: "bg-purple-500" }
];

const mockBookings = [
  { 
    id: 1, 
    date: "2025-08-15", 
    time: "4:00 PM", 
    athlete: "Emma Rodriguez", 
    type: "Tumbling Basics",
    status: "confirmed",
    coach: "Coach Will"
  },
  { 
    id: 2, 
    date: "2025-08-22", 
    time: "5:30 PM", 
    athlete: "Noah Chen", 
    type: "Handstand Training", 
    status: "confirmed",
    coach: "Coach Will"
  },
  { 
    id: 3, 
    date: "2025-08-29", 
    time: "3:30 PM", 
    athlete: "Sophia Kim", 
    type: "Back Walkover", 
    status: "pending",
    coach: "Coach Will"
  }
];

const mockProgress = [
  {
    id: 1,
    athlete: "Emma Rodriguez",
    skill: "Forward Roll",
    videoUrl: "https://example.com/video1",
    coachNotes: "Great improvement! Emma is keeping her chin tucked and rolling in a straight line. Next session we'll work on standing up without using hands.",
    badges: ["First Forward Roll", "Straight Line Master"],
    date: "2025-08-08"
  },
  {
    id: 2,
    athlete: "Noah Chen", 
    skill: "Cartwheel",
    videoUrl: "https://example.com/video2",
    coachNotes: "Excellent hand placement and leg extension. Ready to work on one-handed cartwheels next week!",
    badges: ["Cartwheel Champion", "Perfect Form"],
    date: "2025-08-10"
  }
];

type TestView = 
  | "booking" 
  | "athletes" 
  | "dashboard" 
  | "progress" 
  | "notifications" 
  | "reschedule" 
  | "checkout" 
  | "hero-a" 
  | "hero-b";

export default function TestScreenshots() {
  const [currentView, setCurrentView] = useState<TestView>("booking");
  const [selectedAthlete, setSelectedAthlete] = useState(mockAthletes[0]);

  // Debug logging to track state changes
  React.useEffect(() => {
    console.log('TestScreenshots component mounted/updated, currentView:', currentView);
  }, [currentView]);

  const views: { key: TestView; label: string; description: string }[] = [
    { key: "booking", label: "Booking Calendar", description: "Clean booking UI on phone" },
    { key: "athletes", label: "Add Athletes", description: "Parent adding athlete profiles" },
    { key: "dashboard", label: "Parent Dashboard", description: "Calendar with upcoming/past lessons" },
    { key: "progress", label: "Progress Videos", description: "Video player with coach notes & badges" },
    { key: "notifications", label: "Notifications", description: "Phone notifications and updates" },
    { key: "reschedule", label: "Reschedule Flow", description: "Adjusting lesson time on calendar" },
    { key: "checkout", label: "Secure Checkout", description: "Payment screen with security badges" },
    { key: "hero-a", label: "Hero Image A", description: "Gymnast mid-air action shot" },
    { key: "hero-b", label: "Hero Image B", description: "Phone mockup with parent portal" }
  ];

  const renderView = () => {
    switch (currentView) {
      case "booking":
        return <BookingCalendarView />;
      case "athletes":
        return <AddAthletesView />;
      case "dashboard":
        return <DashboardView />;
      case "progress":
        return <ProgressVideosView />;
      case "notifications":
        return <NotificationsView />;
      case "reschedule":
        return <RescheduleView />;
      case "checkout":
        return <CheckoutView />;
      case "hero-a":
        return <HeroImageA />;
      case "hero-b":
        return <HeroImageB />;
      default:
        return <BookingCalendarView />;
    }
  };

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
      <SEOHead
        title="Test Screenshots - Coach Will Tumbles"
        description="Test pages for capturing feature screenshots"
        robots="noindex,nofollow"
      />
      
      {/* Navigation */}
      <div className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 border-b border-slate-200/60 dark:border-white/10 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Test Screenshots
            </h1>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Current: <span className="font-medium">{views.find(v => v.key === currentView)?.label}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {views.map((view) => (
              <Button
                key={view.key}
                variant={currentView === view.key ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView(view.key)}
                className={`text-xs transition-all duration-300 transform hover:scale-[1.02] ${
                  currentView === view.key 
                    ? 'bg-[#0F0276] hover:bg-[#0F0276]/90 dark:bg-[#D8BD2A] dark:text-[#0F0276] dark:hover:bg-[#D8BD2A]/90' 
                    : 'bg-slate-50/80 text-gray-700 hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/20'
                }`}
              >
                {view.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 rounded-2xl shadow-lg border border-slate-200/60 dark:border-white/10 p-6">
            {renderView()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual test view components
function BookingCalendarView() {
  const [selectedDate, setSelectedDate] = useState("2025-08-15");
  const [selectedTime, setSelectedTime] = useState("4:00 PM");
  
  const timeSlots = [
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 rounded-2xl shadow-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/80 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Book a Lesson</h2>
              <p className="text-white/80 text-sm">Choose your adventure time</p>
            </div>
          </div>
        </div>

        {/* Lesson Type Selection */}
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Lesson Type</h3>
          <div className="space-y-2">
            {["Tumbling Basics", "Handstand Training", "Back Walkover", "Cartwheel Mastery"].map((type) => (
              <div key={type} className="p-3 border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 rounded-lg hover:border-[#D8BD2A] transition-all duration-300 transform hover:scale-[1.02] cursor-pointer backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{type}</span>
                  <Badge variant="outline" className="bg-white/70 dark:bg-white/10">$45</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Select Date</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            <div className="text-slate-500 dark:text-slate-400 font-medium">S</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">M</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">T</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">W</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">T</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">F</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">S</div>
            
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  day === 15 
                    ? "bg-[#D8BD2A] text-[#0F0276] font-bold shadow-lg" 
                    : "hover:bg-white/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-white/5"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Available Times</h3>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                className={`p-3 rounded-lg border transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm ${
                  time === selectedTime
                    ? "border-[#D8BD2A] bg-[#D8BD2A]/10 text-[#0F0276] font-semibold shadow-lg"
                    : "border-slate-200/60 dark:border-white/10 hover:border-[#D8BD2A]/50 text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-white/5"
                }`}
                onClick={() => setSelectedTime(time)}
              >
                <Clock className="h-4 w-4 mx-auto mb-1" />
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Book Button */}
        <div className="p-6">
          <Button className="w-full bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A]/70 text-[#0F0276] font-bold py-3 shadow-lg transform transition-all duration-300 hover:scale-[1.02]">
            Continue to Athlete Selection
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddAthletesView() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Manage Athletes</h2>
              <p className="text-white/80 text-sm">Build your gymnastics team</p>
            </div>
          </div>
        </div>

        {/* Existing Athletes */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Your Athletes</h3>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Athlete
            </Button>
          </div>
          
          <div className="space-y-3">
            {mockAthletes.map((athlete) => (
              <div key={athlete.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${athlete.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                    {athlete.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{athlete.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Age {athlete.age} • {athlete.level}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{athlete.level}</Badge>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Athlete Form */}
        {showAddForm && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Add New Athlete</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input 
                  type="text" 
                  placeholder="Enter athlete name"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Age</label>
                  <select className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900">
                    <option>5</option>
                    <option>6</option>
                    <option>7</option>
                    <option>8</option>
                    <option>9</option>
                    <option>10</option>
                    <option>11</option>
                    <option>12</option>
                    <option>13+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Level</label>
                  <select className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-900">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Add Athlete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:bg-white/10 rounded-2xl shadow-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">My Dashboard</h2>
              <p className="text-white/80 text-sm">Track your gymnastics journey</p>
            </div>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-600">12</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Total Lessons</div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Skills Learned</div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-purple-600">24</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Badges Earned</div>
            </div>
          </div>
        </div>

        {/* Upcoming Lessons */}
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Upcoming Lessons</h3>
          <div className="space-y-3">
            {mockBookings.slice(0, 2).map((booking) => (
              <div key={booking.id} className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-sm rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 transform transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{booking.type}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{booking.athlete}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Progress */}
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Progress</h3>
          <div className="space-y-3">
            {mockProgress.slice(0, 2).map((progress) => (
              <div key={progress.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#D8BD2A] to-[#D8BD2A]/80 rounded-lg">
                    <Video className="h-5 w-5 text-[#0F0276]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{progress.skill}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{progress.athlete}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">New</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressVideosView() {
  const progress = mockProgress[0];
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Progress Report</h2>
              <p className="text-white/80 text-sm">Unlock achievements & watch videos</p>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="h-8 w-8 ml-1" />
              </div>
              <p className="text-lg font-semibold">{progress.skill} Practice</p>
              <p className="text-sm text-white/80">Tap to play video</p>
            </div>
          </div>
          
          {/* Video controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-3 text-white">
              <button className="p-2 bg-white/20 rounded-full">
                <Play className="h-4 w-4" />
              </button>
              <div className="flex-1 h-1 bg-white/30 rounded-full">
                <div className="w-1/3 h-full bg-[#D8BD2A] rounded-full"></div>
              </div>
              <span className="text-sm">0:45 / 2:15</span>
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{progress.skill}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>{progress.athlete}</span>
              <span>•</span>
              <span>{new Date(progress.date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Badges Earned</h4>
            <div className="flex flex-wrap gap-2">
              {progress.badges.map((badge) => (
                <div key={badge} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#D8BD2A]/20 to-[#D8BD2A]/10 border border-[#D8BD2A]/30 rounded-full">
                  <Award className="h-4 w-4 text-[#D8BD2A]" />
                  <span className="text-sm font-medium text-[#0F0276] dark:text-[#D8BD2A]">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Notes */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Coach Notes</h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {progress.coachNotes}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 text-[#0F0276] font-bold">
              Share Progress
            </Button>
            <Button variant="outline" className="w-full">
              Download Video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsView() {
  const notifications = [
    {
      id: 1,
      type: "reminder",
      title: "Lesson Reminder",
      message: "Emma's tumbling lesson is tomorrow at 4:00 PM",
      time: "2 hours ago",
      icon: Bell,
      color: "text-blue-500"
    },
    {
      id: 2,
      type: "progress",
      title: "New Progress Video",
      message: "Coach Will uploaded Noah's cartwheel practice video",
      time: "1 day ago",
      icon: Video,
      color: "text-purple-500"
    },
    {
      id: 3,
      type: "achievement",
      title: "Badge Earned!",
      message: "Sophia earned the 'Perfect Form' badge",
      time: "2 days ago",
      icon: Award,
      color: "text-yellow-500"
    }
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-white/80 text-sm">Stay updated on progress</p>
            </div>
            <div className="relative">
              <Bell className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 ${notification.color}`}>
                  <notification.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{notification.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Settings */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Notification Preferences</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Lesson Reminders</span>
              <div className="w-12 h-6 bg-[#D8BD2A] rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Progress Updates</span>
              <div className="w-12 h-6 bg-[#D8BD2A] rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Marketing Emails</span>
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RescheduleView() {
  const [selectedDate, setSelectedDate] = useState("2025-08-22");
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/20 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Reschedule Lesson</h2>
              <p className="text-white/80 text-sm">Change your adventure time</p>
            </div>
          </div>
        </div>

        {/* Current Booking */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-900/20">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Current Booking</h3>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Handstand Training</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Noah Chen</p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Aug 22, 2025 at 5:30 PM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Date Selection */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Select New Date</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-sm mb-4">
            <div className="text-slate-500 dark:text-slate-400 font-medium">S</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">M</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">T</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">W</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">T</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">F</div>
            <div className="text-slate-500 dark:text-slate-400 font-medium">S</div>
            
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                className={`p-2 rounded-lg transition-colors ${
                  day === 29 
                    ? "bg-indigo-500 text-white font-bold" 
                    : day === 22
                    ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 line-through"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
                disabled={day === 22}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Available Times */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Available Times</h3>
          <div className="grid grid-cols-2 gap-2">
            {["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "6:00 PM"].map((time) => (
              <button
                key={time}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Clock className="h-4 w-4 mx-auto mb-1" />
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Reschedule Policy */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/20">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Reschedule Policy</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Free reschedule up to 24 hours before lesson. Less than 24 hours: $5 fee applies.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold">
            Confirm Reschedule
          </Button>
          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
            Cancel Lesson Instead
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckoutView() {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Secure Checkout</h2>
              <p className="text-white/80 text-sm">Protected by industry-standard encryption</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-900 dark:text-white font-medium">30-Min Private Lesson</span>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>📅 Saturday, Aug 16 at 2:00 PM</p>
                  <p>👧 Emma Rodriguez (Age 8)</p>
                  <p>🎯 Focus: Handstand & Cartwheel</p>
                </div>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">$40.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Reservation Fee</span>
              <span className="font-semibold text-slate-900 dark:text-white">$5.00</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Total Due Today</span>
              <span className="font-bold text-emerald-600 text-lg">$5.00</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Payment Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800"
                />
                <div className="absolute right-3 top-3">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expiry</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CVC</label>
                <input 
                  type="text" 
                  placeholder="123"
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cardholder Name</label>
              <input 
                type="text" 
                placeholder="Sarah Rodriguez"
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Stripe Protected</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
            Your payment information is encrypted and secure
          </p>
        </div>

        {/* Complete Payment */}
        <div className="p-6">
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 text-lg">
            Complete Payment - $5.00
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
            By completing this purchase, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroImageA() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="aspect-video relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🤸‍♀️</div>
            <h3 className="text-2xl font-bold mb-2">Hero Image A</h3>
            <p className="text-lg opacity-90">Smiling young gymnast mid-air during confident tumbling pass</p>
            <p className="text-sm opacity-75 mt-2">Action shot showcasing skill and confidence</p>
          </div>
        </div>
        
        <div className="p-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Level Up Your Child's Training
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Book fast. Track progress. Celebrate wins.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroImageB() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="grid md:grid-cols-2 items-center gap-8 p-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Track Real Progress, Not Just Attendance
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
              Book in minutes. Get videos and coach notes after.
            </p>
            <Button className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 text-[#0F0276] font-bold">
              Start Your Journey
            </Button>
          </div>
          
          <div className="relative">
            <div className="mx-auto w-64 h-96 bg-slate-900 rounded-3xl shadow-2xl border-8 border-slate-800 relative overflow-hidden">
              {/* Phone screen */}
              <div className="absolute inset-2 bg-white dark:bg-slate-100 rounded-2xl overflow-hidden">
                {/* Status bar */}
                <div className="h-8 bg-slate-900 flex items-center justify-between px-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="text-white text-xs font-medium">9:41</div>
                  <div className="text-white text-xs">100%</div>
                </div>
                
                {/* App content */}
                <div className="p-4 space-y-4">
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900">My Dashboard</h3>
                    <p className="text-xs text-slate-600">Track your gymnastics journey</p>
                  </div>
                  
                  {/* Progress cards */}
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-900">New Progress Video</span>
                      </div>
                      <p className="text-xs text-slate-600">Forward Roll Mastery</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-slate-900">Badge Earned</span>
                      </div>
                      <p className="text-xs text-slate-600">Perfect Form</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900">Next Lesson</span>
                      </div>
                      <p className="text-xs text-slate-600">Tomorrow 4:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-slate-600 rounded-full"></div>
            </div>
            
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-[#D8BD2A]/20 to-[#0F0276]/20 rounded-3xl blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
