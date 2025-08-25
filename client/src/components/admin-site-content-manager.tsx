import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, HelpCircle, Image, Mail, MapPin, Phone, Save, Star, Upload, Users, Video, FileText } from 'lucide-react';
import React, { useEffect, useState, useCallback, memo } from 'react';
import TestimonialForm from './TestimonialForm';
import { MainContentContainer } from '@/components/admin-ui/MainContentContainer';

interface SiteContent {
  bannerVideo: string;
  heroImages: string[];
  equipmentImages: string[];
  about: {
    bio: string;
    certifications: Array<{ title: string; body: string }>;
    experience: string;
    photo?: string;
  };
  contact: {
    phone: string;
    email: string;
    address: {
      name: string;
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  hours: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  apparatus: string[];
  skills: {
    [apparatus: string]: string[];
  };
  sideQuests: string[];
  testimonials: Array<{
    id?: number;
    name: string;
    text: string;
    rating: number;
    featured?: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    category: string;
  }>;
}

export function AdminSiteContentManager() {
  const { toast } = useToast();
  const [content, setContent] = useState<SiteContent>({
    bannerVideo: '',
    heroImages: [],
    equipmentImages: [
      "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
    ],
    about: {
      bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson...',
      certifications: [
        { title: 'USA Gymnastics Certified', body: 'Official certification from USA Gymnastics' },
        { title: 'CPR/First Aid Certified', body: 'Current safety and emergency response training' },
        { title: 'Background Checked', body: 'Comprehensive background verification completed' }
      ],
      experience: 'Nearly 10 years of coaching experience with athletes of all levels'
    },
    contact: {
      phone: '(585) 755-8122',
      email: 'Admin@coachwilltumbles.com',
      address: {
        name: 'Oceanside Gymnastics',
        street: '1935 Ave. del Oro #A',
        city: 'Oceanside',
        state: 'CA',
        zip: '92056'
      }
    },
    hours: {
      Monday: { start: '09:00', end: '17:00', available: true },
      Tuesday: { start: '09:00', end: '17:00', available: true },
      Wednesday: { start: '09:00', end: '17:00', available: true },
      Thursday: { start: '09:00', end: '17:00', available: true },
      Friday: { start: '09:00', end: '17:00', available: true },
      Saturday: { start: '08:00', end: '16:00', available: true },
      Sunday: { start: '10:00', end: '15:00', available: false }
    },
    apparatus: ['Floor Exercise', 'Balance Beam', 'Uneven Bars', 'Vault', 'Trampoline', 'Tumble Track'],
    skills: {
      'Floor Exercise': ['Forward Roll', 'Backward Roll', 'Cartwheel', 'Round Off', 'Handstand'],
      'Balance Beam': ['Straight Line Walk', 'Heel-to-Toe Walk', 'Straight Leg Kick', 'Scale', 'Cartwheel'],
      'Uneven Bars': ['Support Hold', 'Pull-ups', 'Cast', 'Back Hip Circle', 'Glide Swing'],
      'Vault': ['Straight Jump', 'Squat On', 'Straddle On', 'Handstand Flat Back', 'Cartwheel'],
      'Trampoline': ['Seat Drop', 'Knee Drop', 'Front Drop', 'Back Drop', 'Swivel Hips'],
      'Tumble Track': ['Forward Roll', 'Backward Roll', 'Handstand Forward Roll', 'Back Walkover', 'Front Walkover']
    },
    sideQuests: ['Flexibility Training', 'Strength Building', 'Agility Drills', 'Mental Focus', 'Confidence Building'],
    testimonials: [
      {
        name: 'Sarah M.',
        text: 'Coach Will transformed my daughter\'s confidence! She went from shy to performing amazing routines.',
        rating: 5
      },
      {
        name: 'Mike & Lisa P.',
        text: 'Best investment we\'ve made in our son\'s athletic development. Will is patient and encouraging.',
        rating: 5
      }
    ],
    faqs: [
      {
        question: 'What age groups do you work with?',
        answer: 'I work with athletes ages 6 and up, from complete beginners to advanced gymnasts preparing for competitive levels.',
        category: 'General'
      },
      {
        question: 'Do you provide equipment?',
        answer: 'Yes! All lessons are conducted at Oceanside Gymnastics with professional-grade equipment including floor, beam, bars, vault, and trampoline.',
        category: 'Equipment'
      },
      {
        question: 'What should my child wear?',
        answer: 'Athletes should wear comfortable athletic clothing they can move freely in. Avoid loose clothing with strings or zippers. Bare feet or gymnastics shoes are recommended.',
        category: 'Preparation'
      }
    ]
  });

  // Ordered days array for consistent display
  const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [activeTab, setActiveTab] = useState('media');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load site content on component mount
  useEffect(() => {
    const loadSiteContent = async () => {
      try {
        const response = await apiRequest('GET', '/api/site-content');
        if (response.ok) {
          const data = await response.json();
          console.log('Admin loaded site content:', data);
          console.log('Admin banner video:', data.bannerVideo);
          setContent(prevContent => ({
            ...prevContent,
            ...data
          }));
        }
      } catch (error) {
        console.error('Error loading site content:', error);
        toast({
          title: 'Load Error',
          description: 'Failed to load site content. Using default values.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSiteContent();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save content to backend
      const response = await apiRequest('POST', '/api/admin/site-content', content);

      if (response.ok) {
        toast({
          title: 'Content Saved',
          description: 'Site content has been updated successfully.',
        });
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save site content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Individual section save handlers
  const handleSaveSection = async (sectionData: any, sectionName: string) => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content', sectionData);

      if (response.ok) {
        toast({
          title: `${sectionName} Saved`,
          description: `${sectionName} section has been updated successfully.`,
        });
      } else {
        throw new Error(`Failed to save ${sectionName}`);
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: `Failed to save ${sectionName}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Testimonial management handlers
  const handleSaveTestimonial = async (testimonial: any, index?: number) => {
    setSaving(true);
    try {
      let response;
      if (typeof index === 'number' && content.testimonials[index]?.id) {
        // Update existing testimonial
        response = await apiRequest('PUT', `/api/admin/testimonials/${content.testimonials[index].id}`, testimonial);
      } else {
        // Create new testimonial
        response = await apiRequest('POST', '/api/admin/testimonials', testimonial);
      }

      if (response.ok) {
        const updatedTestimonial = await response.json();
        if (typeof index === 'number') {
          // Update existing in state
          setContent(prev => ({
            ...prev,
            testimonials: prev.testimonials.map((t, i) => i === index ? updatedTestimonial : t)
          }));
        } else {
          // Add new to state
          setContent(prev => ({
            ...prev,
            testimonials: [...prev.testimonials, updatedTestimonial]
          }));
        }
        toast({
          title: 'Testimonial Saved',
          description: 'Testimonial has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save testimonial');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save testimonial. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (index: number) => {
    if (!content.testimonials[index]?.id) return;
    
    setSaving(true);
    try {
      const response = await apiRequest('DELETE', `/api/admin/testimonials/${content.testimonials[index].id}`);

      if (response.ok) {
        setContent(prev => ({
          ...prev,
          testimonials: prev.testimonials.filter((_, i) => i !== index)
        }));
        toast({
          title: 'Testimonial Deleted',
          description: 'Testimonial has been deleted successfully.',
        });
      } else {
        throw new Error('Failed to delete testimonial');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete testimonial. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetFeaturedTestimonial = async (index: number) => {
    if (!content.testimonials[index]?.id) return;
    
    setSaving(true);
    try {
      const response = await apiRequest('POST', `/api/admin/testimonials/${content.testimonials[index].id}/feature`);

      if (response.ok) {
        // Update state to reflect only this testimonial is featured
        setContent(prev => ({
          ...prev,
          testimonials: prev.testimonials.map((t, i) => ({
            ...t,
            featured: i === index
          }))
        }));
        toast({
          title: 'Featured Testimonial Set',
          description: 'This testimonial is now featured.',
        });
      } else {
        throw new Error('Failed to set featured testimonial');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to set featured testimonial. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (path: string, value: any) => {
    setContent(prev => {
      const newContent = { ...prev } as any;
      const keys = path.split('.');
      let current = newContent;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] = { ...current[keys[i]] };
      }
      
      current[keys[keys.length - 1]] = value;
      return newContent;
    });
  };

  const addArrayItem = (path: string, item: any) => {
    const current = path.split('.').reduce((obj: any, key: string) => obj[key], content as any);
    if (Array.isArray(current)) {
      updateContent(path, [...current, item]);
    }
  };

  const removeArrayItem = (path: string, index: number) => {
    const current = path.split('.').reduce((obj: any, key: string) => obj[key], content as any);
    if (Array.isArray(current)) {
      updateContent(path, current.filter((_, i) => i !== index));
    }
  };

  // Sectional save handlers
  const handleSaveHeroSection = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content/hero', {
        heroImages: content.heroImages,
        bannerVideo: content.bannerVideo
      });

      if (response.ok) {
        toast({
          title: 'Hero Section Saved',
          description: 'Hero section content has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save hero section');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save hero section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAboutSection = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content/about', {
        about: content.about
      });

      if (response.ok) {
        toast({
          title: 'About Section Saved',
          description: 'About section content has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save about section');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save about section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContactSection = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content/contact', {
        contact: content.contact
      });

      if (response.ok) {
        toast({
          title: 'Contact Section Saved',
          description: 'Contact section content has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save contact section');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save contact section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMediaSection = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content/media', {
        equipmentImages: content.equipmentImages,
        bannerVideo: content.bannerVideo
      });

      if (response.ok) {
        toast({
          title: 'Media Section Saved',
          description: 'Media section content has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save media section');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save media section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHoursSection = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('POST', '/api/admin/site-content/hours', {
        hours: content.hours
      });

      if (response.ok) {
        toast({
          title: 'Hours Saved',
          description: 'Hours of operation have been saved successfully.',
        });
      } else {
        throw new Error('Failed to save hours');
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save hours. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Callback functions for child components
  const handleSaveAbout = useCallback(async (aboutData: SiteContent['about']) => {
    console.log("[DEBUG-MAIN] handleSaveAbout called with:", {
      hasPhoto: !!aboutData.photo,
      photo: aboutData.photo,
      keys: Object.keys(aboutData)
    });
    
    const response = await apiRequest('POST', '/api/admin/site-content/about', {
      about: aboutData
    });

    if (!response.ok) {
      throw new Error('Failed to save about section');
    }

    // Update the main content state
    setContent(prev => ({
      ...prev,
      about: aboutData
    }));
    
    console.log("[DEBUG-MAIN] Content state updated with new about data");

    // Force a refetch to ensure we have the latest data
    try {
      console.log("[DEBUG-MAIN] Refetching site content");
      const refreshResponse = await apiRequest('GET', '/api/site-content');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log("[DEBUG-MAIN] Refetch response:", {
          hasAbout: !!refreshData.about,
          aboutPhoto: refreshData.about?.photo,
          aboutKeys: refreshData.about ? Object.keys(refreshData.about) : []
        });
        setContent(prevContent => ({
          ...prevContent,
          ...refreshData
        }));
      }
    } catch (error) {
      console.error('Error refreshing site content after save:', error);
    }
  }, []);

  const handleSaveContact = useCallback(async (contactData: SiteContent['contact']) => {
    const response = await apiRequest('POST', '/api/admin/site-content/contact', {
      contact: contactData
    });

    if (!response.ok) {
      throw new Error('Failed to save contact information');
    }

    // Update the main content state
    setContent(prev => ({
      ...prev,
      contact: contactData
    }));
  }, []);

  const handleSaveHours = useCallback(async (hoursData: SiteContent['hours']) => {
    // Convert lowercase keys back to capitalized format for backend
    const capitalizedHoursData: any = {};
    Object.keys(hoursData).forEach(key => {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      capitalizedHoursData[capitalizedKey] = hoursData[key];
    });

    const response = await apiRequest('POST', '/api/admin/site-content/hours', {
      hours: capitalizedHoursData
    });

    if (!response.ok) {
      throw new Error('Failed to save hours information');
    }

    // Update the main content state with capitalized keys
    setContent(prev => ({
      ...prev,
      hours: capitalizedHoursData
    }));
  }, []);

  const handleSaveFaqs = useCallback(async (faqsData: SiteContent['faqs']) => {
    const response = await apiRequest('POST', '/api/admin/faqs/bulk', {
      faqs: faqsData
    });

    if (!response.ok) {
      throw new Error('Failed to save FAQs');
    }

    // Update the main content state
    setContent(prev => ({
      ...prev,
      faqs: faqsData
    }));
  }, []);

  // About Tab Component
  const AboutTabContent = memo(({ 
    initialData, 
    onSave 
  }: { 
    initialData: SiteContent['about']; 
    onSave: (data: SiteContent['about']) => void; 
  }) => {
    const [localData, setLocalData] = useState(initialData);
    const { toast } = useToast();

    // Update localData when initialData changes (e.g., after a refetch)
    useEffect(() => {
      setLocalData(initialData);
    }, [initialData]);

    const handleSave = async () => {
      try {
        console.log("[DEBUG-ADMIN] Saving about data:", {
          hasPhoto: !!localData.photo,
          photo: localData.photo,
          keys: Object.keys(localData)
        });
        setSaving(true);
        await onSave(localData);
        console.log("[DEBUG-ADMIN] Save completed successfully");
        toast({
          title: 'About Section Saved',
          description: 'About information has been saved successfully.',
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save About section. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    };

    const updateLocal = (path: string, value: any) => {
      setLocalData(prev => {
        const newData = { ...prev } as any;
        const keys = path.split('.');
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] = { ...current[keys[i]] };
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    };

    return (
      <Card className="rounded-xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            About Coach Will
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="about-bio">Biography</Label>
            <Textarea
              id="about-bio"
              value={localData?.bio || ''}
              onChange={(e) => updateLocal('bio', e.target.value)}
              placeholder="Share your story, experience, and passion for gymnastics..."
              className="min-h-[120px] resize-y"
            />
          </div>

          <div className="space-y-4">
            <Label>Coach Photo</Label>
            <div className="flex items-center gap-4">
              {localData?.photo && (
                <div className="relative">
                  <img 
                    src={localData.photo} 
                    alt="Coach preview" 
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    onClick={() => updateLocal('photo', '')}
                  >
                    ×
                  </Button>
                </div>
              )}
              
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      toast({
                        title: "Uploading Photo",
                        description: `Uploading: ${file.name}...`,
                      });
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const response = await fetch('/api/admin/media', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log("[DEBUG-ADMIN] Photo upload response:", data);
                        // Build a new about object with the uploaded photo URL and persist immediately
                        const newAbout = { ...localData, photo: data.url };
                        setLocalData(newAbout);
                        console.log("[DEBUG-ADMIN] Persisting about after upload:", {
                          hasPhoto: !!newAbout.photo,
                          photo: newAbout.photo,
                          keys: Object.keys(newAbout)
                        });
                        try {
                          setSaving(true);
                          await onSave(newAbout);
                          console.log("[DEBUG-ADMIN] Auto-saved about with new photo");
                        } finally {
                          setSaving(false);
                        }
                        toast({
                          title: "Photo Uploaded",
                          description: `Successfully uploaded: ${file.name}`,
                        });
                      } else {
                        throw new Error('Upload failed');
                      }
                    } catch (error) {
                      console.error('Error uploading photo:', error);
                      toast({
                        title: "Upload Failed",
                        description: "Failed to upload photo. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }
                }}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="about-experience">Years of Experience</Label>
            <Input
              id="about-experience"
              value={localData?.experience || ''}
              onChange={(e) => updateLocal('experience', e.target.value)}
              placeholder="e.g., 8+ years"
            />
          </div>

          <div>
            <Label>Certifications</Label>
            <div className="space-y-4">
              {localData?.certifications?.map((cert, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={cert.title || ''}
                      onChange={(e) => {
                        const newCerts = [...(localData.certifications || [])];
                        newCerts[index] = { ...newCerts[index], title: e.target.value };
                        updateLocal('certifications', newCerts);
                      }}
                      placeholder="Certification title (e.g., USA Gymnastics Certified)"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={cert.body || ''}
                      onChange={(e) => {
                        const newCerts = [...(localData.certifications || [])];
                        newCerts[index] = { ...newCerts[index], body: e.target.value };
                        updateLocal('certifications', newCerts);
                      }}
                      placeholder="Brief description of this certification"
                      rows={2}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newCerts = localData.certifications?.filter((_, i) => i !== index) || [];
                      updateLocal('certifications', newCerts);
                    }}
                  >
                    Remove Certification
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newCerts = [...(localData.certifications || []), { title: '', body: '' }];
                  updateLocal('certifications', newCerts);
                }}
              >
                Add Certification
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save About Section'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Contact Tab Component
  const ContactTabContent = memo(({ 
    initialData, 
    onSave 
  }: { 
    initialData: SiteContent['contact']; 
    onSave: (data: SiteContent['contact']) => void; 
  }) => {
    const [localData, setLocalData] = useState(initialData);
    const { toast } = useToast();

    const handleSave = async () => {
      try {
        setSaving(true);
        await onSave(localData);
        toast({
          title: 'Contact Information Saved',
          description: 'Contact information has been saved successfully.',
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save contact information. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    };

    const updateLocal = (path: string, value: any) => {
      setLocalData(prev => {
        const newData = { ...prev } as any;
        const keys = path.split('.');
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] = { ...current[keys[i]] };
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    };

    return (
      <Card className="rounded-xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200 flex items-center gap-3">
            <MapPin className="h-6 w-6 text-green-600 dark:text-green-300" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                value={localData?.phone || ''}
                onChange={(e) => updateLocal('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email Address</Label>
              <Input
                id="contact-email"
                value={localData?.email || ''}
                onChange={(e) => updateLocal('email', e.target.value)}
                placeholder="coach@example.com"
                type="email"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-green-700">Gym Address</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="address-name">Gym Name</Label>
                <Input
                  id="address-name"
                  value={localData?.address?.name || ''}
                  onChange={(e) => updateLocal('address.name', e.target.value)}
                  placeholder="Gym Name"
                />
              </div>
              <div>
                <Label htmlFor="address-street">Street Address</Label>
                <Input
                  id="address-street"
                  value={localData?.address?.street || ''}
                  onChange={(e) => updateLocal('address.street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="address-city">City</Label>
                  <Input
                    id="address-city"
                    value={localData?.address?.city || ''}
                    onChange={(e) => updateLocal('address.city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="address-state">State</Label>
                  <Input
                    id="address-state"
                    value={localData?.address?.state || ''}
                    onChange={(e) => updateLocal('address.state', e.target.value)}
                    placeholder="CA"
                  />
                </div>
                <div>
                  <Label htmlFor="address-zip">ZIP Code</Label>
                  <Input
                    id="address-zip"
                    value={localData?.address?.zip || ''}
                    onChange={(e) => updateLocal('address.zip', e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Contact Info'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Hours Tab Component
  const HoursTabContent = memo(({ 
    initialData, 
    onSave,
    orderedDays 
  }: { 
    initialData: SiteContent['hours']; 
    onSave: (data: SiteContent['hours']) => void;
    orderedDays: string[];
  }) => {
    // Initialize with default values if data is missing
    const [localData, setLocalData] = useState(() => {
      const defaultHours = orderedDays.reduce((acc, day) => {
        acc[day.toLowerCase()] = {
          start: '',
          end: '',
          available: false
        };
        return acc;
      }, {} as any);
      
      // Convert initialData keys to lowercase to match component expectations
      const normalizedInitialData: any = {};
      if (initialData) {
        Object.keys(initialData).forEach(key => {
          const lowerKey = key.toLowerCase();
          normalizedInitialData[lowerKey] = initialData[key];
        });
      }
      
      // Merge with existing data
      return { ...defaultHours, ...normalizedInitialData };
    });
    const { toast } = useToast();

    // Sync with parent data changes when initialData updates
    useEffect(() => {
      if (initialData && Object.keys(initialData).length > 0) {
        const defaultHours = orderedDays.reduce((acc, day) => {
          acc[day.toLowerCase()] = {
            start: '',
            end: '',
            available: false
          };
          return acc;
        }, {} as any);
        
        // Convert initialData keys to lowercase to match component expectations
        const normalizedInitialData: any = {};
        Object.keys(initialData).forEach(key => {
          const lowerKey = key.toLowerCase();
          normalizedInitialData[lowerKey] = initialData[key];
        });
        
        // Merge with incoming data
        setLocalData({ ...defaultHours, ...normalizedInitialData });
      }
    }, [initialData, orderedDays]);

    const handleSave = async () => {
      try {
        setSaving(true);
        
        // Normalize time format to HH:MM before saving
        const normalizedData = { ...localData };
        
        // Ensure all day entries have properly formatted times
        Object.keys(normalizedData).forEach(day => {
          const dayData = normalizedData[day];
          if (dayData && typeof dayData === 'object') {
            // Normalize start and end times to HH:MM format
            if (dayData.start && typeof dayData.start === 'string') {
              // Convert various time formats to HH:MM
              const normalizedStart = normalizeTimeToHHMM(dayData.start);
              dayData.start = normalizedStart;
            }
            if (dayData.end && typeof dayData.end === 'string') {
              const normalizedEnd = normalizeTimeToHHMM(dayData.end);
              dayData.end = normalizedEnd;
            }
          }
        });

        await onSave(normalizedData);
        toast({
          title: 'Hours Saved',
          description: 'Hours of operation have been saved successfully.',
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save hours. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    };

    // Helper function to normalize time format to HH:MM
    const normalizeTimeToHHMM = (timeStr: string): string => {
      if (!timeStr) return '';
      
      // If already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }
      
      // Handle 12-hour format (e.g., "9:00 AM", "3:30 PM")
      const time12HourMatch = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
      if (time12HourMatch) {
        let [, hours, minutes, ampm] = time12HourMatch;
        let hour24 = parseInt(hours, 10);
        minutes = minutes || '00';
        
        if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        return `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Handle time input format (might already be HH:MM)
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      // Fallback: return original string
      return timeStr;
    };

    const updateLocal = (path: string, value: any) => {
      setLocalData((prev: any) => {
        const newData = { ...prev } as any;
        const keys = path.split('.');
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] = { ...current[keys[i]] };
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    };

    const formatTimeRange = (start: string, end: string) => {
      if (!start || !end) return '';
      return `${start} - ${end}`;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
              <Clock className="h-7 w-7 text-[#D8BD2A]" />
              Hours of Operation Management
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Configure your business hours and availability for online booking
            </p>
          </div>
        </div>

        {/* Current Hours Display */}
        {(() => {
          const hasAnyHours = orderedDays.some(day => {
            const hours = localData[day.toLowerCase()];
            return hours?.available && hours?.start && hours?.end;
          });

          if (hasAnyHours) {
            return (
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 dark:bg-white/10 dark:border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-800 dark:text-white flex items-center gap-2">
                    📅 Current Business Hours
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {orderedDays.map(day => {
                      const hours = localData[day.toLowerCase()];
                      const isAvailable = hours?.available && hours?.start && hours?.end;
                      
                      return (
                        <div key={day} className={`p-3 rounded-lg border ${
                          isAvailable 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {day}
                            </span>
                            {isAvailable ? (
                              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                {formatTimeRange(hours.start, hours.end)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Contact required
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }
          
          return null;
        })()}

        {/* Business Hours System Overview */}
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 dark:bg-white/10 dark:border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-white flex items-center gap-2">
              🚀 Business Hours System
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
              Configure when customers can book lessons. Days marked as unavailable will show "Ask us about availability!" on the website.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 dark:bg-white/10 dark:border-white/20 rounded-xl p-4">
                <h4 className="font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  ✅ Available Days
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Show your operating hours and allow online booking during these times.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 dark:bg-white/10 dark:border-white/20 rounded-xl p-4">
                <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                  📞 Contact Days
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Unavailable days prompt customers to contact you directly for special arrangements.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Perfect for holidays or special event days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 gap-4">
          {orderedDays.map((day) => {
            const hours = localData[day.toLowerCase() as keyof typeof localData];
            const isAvailable = hours?.available || false;
            const hasTimeSet = hours?.start && hours?.end;
            
            return (
              <div key={day} className="bg-white/60 backdrop-blur-sm border border-slate-200/60 dark:bg-white/10 dark:border-white/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-[#0F0276] dark:text-white">
                        {day}
                      </h4>
                      {isAvailable && hasTimeSet && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeRange(hours.start, hours.end)}
                        </Badge>
                      )}
                      {!isAvailable && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300">
                          Contact Required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`available-${day}`}
                        checked={isAvailable}
                        onChange={(e) => updateLocal(`${day.toLowerCase()}.available`, e.target.checked)}
                        className="rounded border-gray-300 text-[#0F0276] focus:ring-[#0F0276] h-4 w-4"
                      />
                      <Label htmlFor={`available-${day}`} className="text-sm font-medium">
                        Available for booking
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">From:</Label>
                      <Input
                        type="time"
                        value={hours?.start || ''}
                        onChange={(e) => updateLocal(`${day.toLowerCase()}.start`, e.target.value)}
                        className="flex-1 bg-white/80 border-slate-300 dark:bg-slate-800/80 dark:border-slate-600"
                        disabled={!isAvailable}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">To:</Label>
                      <Input
                        type="time"
                        value={hours?.end || ''}
                        onChange={(e) => updateLocal(`${day.toLowerCase()}.end`, e.target.value)}
                        className="flex-1 bg-white/80 border-slate-300 dark:bg-slate-800/80 dark:border-slate-600"
                        disabled={!isAvailable}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#0F0276] to-[#0F0276]/90 hover:from-[#0F0276]/90 hover:to-[#0F0276] border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3 font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Hours'}
          </Button>
        </div>
      </div>
    );
  });

  // FAQs Tab Component
  const FAQsTabContent = memo(({ 
    initialData, 
    onSave 
  }: { 
    initialData: SiteContent['faqs']; 
    onSave: (data: SiteContent['faqs']) => void; 
  }) => {
    const [localData, setLocalData] = useState(initialData || []);
    const { toast } = useToast();

    // Sync with parent data changes
    useEffect(() => {
      setLocalData(initialData || []);
    }, [initialData]);

    const handleSave = async () => {
      try {
        setSaving(true);
        await onSave(localData);
        toast({
          title: 'FAQs Saved',
          description: 'Frequently Asked Questions have been saved successfully.',
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save FAQs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
    };

    const updateFAQ = (index: number, field: string, value: string) => {
      setLocalData(prev => {
        const newData = [...prev];
        newData[index] = { ...newData[index], [field]: value };
        return newData;
      });
    };

    const removeFAQ = (index: number) => {
      setLocalData(prev => prev.filter((_, i) => i !== index));
    };

    const addFAQ = () => {
      setLocalData(prev => [...prev, { question: '', answer: '', category: 'General' }]);
    };

    return (
      <Card className="rounded-xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {localData.map((faq, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Question</Label>
                  <Input
                    value={faq.question || ''}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    placeholder="Enter the question"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={faq.category || ''}
                    onChange={(e) => updateFAQ(index, 'category', e.target.value)}
                    placeholder="e.g., General, Equipment, Pricing"
                  />
                </div>
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea
                  value={faq.answer || ''}
                  onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                  placeholder="Enter the answer to this question..."
                  rows={3}
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeFAQ(index)}
              >
                Remove FAQ
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={addFAQ}
            >
              Add FAQ
            </Button>
          </div>
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {saving ? 'Saving...' : 'Save FAQs'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Site Content Management</h2>
          <Button disabled className="btn-athletic-gold">
            <Save className="w-4 h-4 mr-2" />
            Loading...
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="animate-spin w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <MainContentContainer
          heading="Site Content Manager"
          icon={<FileText className="h-8 w-8" />}
          actions={
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-gradient-to-r from-[#D8BD2A] to-[#D8BD2A]/80 hover:from-[#D8BD2A]/90 hover:to-[#D8BD2A]/70 text-[#0F0276] font-bold shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-xl px-6 py-3"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          }
        >
          <TabsList className="grid grid-cols-4 grid-rows-2 h-auto p-1 gap-1 bg-muted rounded-md text-muted-foreground w-full sm:inline-flex sm:h-10 sm:grid-cols-8 sm:grid-rows-1 sm:items-center sm:justify-center">
            <TabsTrigger value="media" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Video className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Users className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <MapPin className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Clock className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Hours</span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Upload className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Programs</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Star className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <HelpCircle className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-2 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
              <Mail className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden xs:inline">Emails</span>
            </TabsTrigger>
          </TabsList>
        </MainContentContainer>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-6 space-y-6 p-6">
            <Card className="rounded-xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-purple-800 dark:text-purple-200 flex items-center gap-3">
                <Video className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                Banner Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="banner-video">Video URL or File Path</Label>
                <Input
                  id="banner-video"
                  value={content.bannerVideo}
                  onChange={(e) => updateContent('bannerVideo', e.target.value)}
                  placeholder="https://example.com/video.mp4 or /assets/banner.mp4"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setSaving(true);
                          toast({
                            title: "Uploading Video",
                            description: `Uploading: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)...`,
                          });

                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/admin/media', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });

                          if (response.ok) {
                            const result = await response.json();
                            updateContent('bannerVideo', result.url);
                            
                            // Auto-save after successful upload
                            try {
                              await handleSaveMediaSection();
                            } catch (saveError) {
                              console.warn('Auto-save after upload failed:', saveError);
                            }
                            
                            toast({
                              title: "Video Uploaded",
                              description: `Successfully uploaded: ${file.name}`,
                            });
                          } else {
                            // Read the detailed error message from server
                            const errorData = await response.text();
                            console.error('Video upload failed:', {
                              status: response.status,
                              statusText: response.statusText,
                              response: errorData,
                              fileName: file.name,
                              fileSize: file.size,
                              mimeType: file.type
                            });

                            let errorMessage = 'Upload failed';
                            try {
                              const parsedError = JSON.parse(errorData);
                              errorMessage = parsedError.error || 'Upload failed';
                              
                              // Log additional details if provided
                              if (parsedError.details) {
                                console.error('Upload error details:', parsedError.details);
                              }
                            } catch (parseError) {
                              // If response isn't JSON, use the raw text
                              errorMessage = errorData || 'Upload failed';
                            }

                            throw new Error(errorMessage);
                          }
                        } catch (error: any) {
                          console.error('Error uploading video:', error);
                          
                          // Provide user-friendly error messages
                          let userMessage = error.message;
                          
                          // Handle common error scenarios
                          if (userMessage.includes('size') || userMessage.includes('limit') || file.size > 100 * 1024 * 1024) {
                            userMessage = `File too large (${Math.round(file.size / 1024 / 1024)}MB). Videos must be under 100MB.`;
                          } else if (userMessage.includes('type') || userMessage.includes('mime')) {
                            userMessage = `File type '${file.type}' not supported. Please use MP4, WebM, or MOV files.`;
                          } else if (userMessage.includes('bucket')) {
                            userMessage = 'Storage configuration error. Please contact support.';
                          } else if (userMessage === 'Upload failed' || userMessage === 'Failed to fetch') {
                            userMessage = 'Upload failed. Please check your connection and try again.';
                          }

                          toast({
                            title: "Upload Failed",
                            description: userMessage,
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      document.getElementById('video-upload')?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('Preview button clicked, bannerVideo:', content.bannerVideo);
                    setPreviewOpen(true);
                  }}
                  disabled={!content.bannerVideo}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-3">
                <Image className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                Hero Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.heroImages.map((image, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const newImages = [...content.heroImages];
                      newImages[index] = e.target.value;
                      updateContent('heroImages', newImages);
                    }}
                    placeholder="Image URL or path"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setSaving(true);
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/admin/media', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });

                          if (response.ok) {
                            const result = await response.json();
                            const newImages = [...content.heroImages];
                            newImages[index] = result.url;
                            updateContent('heroImages', newImages);
                            toast({
                              title: "Image Uploaded",
                              description: `Successfully uploaded: ${file.name}`,
                            });
                          } else {
                            throw new Error('Upload failed');
                          }
                        } catch (error) {
                          console.error('Error uploading image:', error);
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload image. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    className="hidden"
                    id={`hero-image-upload-${index}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      document.getElementById(`hero-image-upload-${index}`)?.click();
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('heroImages', index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addArrayItem('heroImages', '')}
              >
                Add Image
              </Button>
            </CardContent>
          </Card>

          {/* Equipment Images Card */}
          <Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
                <Image className="h-6 w-6 text-[#D8BD2A]" />
                Training Equipment Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.equipmentImages.map((image, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const newImages = [...content.equipmentImages];
                      newImages[index] = e.target.value;
                      updateContent('equipmentImages', newImages);
                    }}
                    placeholder="Equipment image URL or path"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setSaving(true);
                          const formData = new FormData();
                          formData.append('file', file);

                          const response = await fetch('/api/admin/media', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });

                          if (response.ok) {
                            const result = await response.json();
                            const newImages = [...content.equipmentImages];
                            newImages[index] = result.url;
                            updateContent('equipmentImages', newImages);
                            toast({
                              title: "Equipment Image Uploaded",
                              description: `Successfully uploaded: ${file.name}`,
                            });
                          } else {
                            throw new Error('Upload failed');
                          }
                        } catch (error) {
                          console.error('Error uploading equipment image:', error);
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload equipment image. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    className="hidden"
                    id={`equipment-image-upload-${index}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      document.getElementById(`equipment-image-upload-${index}`)?.click();
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('equipmentImages', index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addArrayItem('equipmentImages', '')}
              >
                Add Equipment Image
              </Button>
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveMediaSection}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Media Section'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-6 space-y-6 p-6">
          <AboutTabContent
            initialData={content.about}
            onSave={handleSaveAbout}
          />
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="mt-6 space-y-6 p-6">
          <ContactTabContent
            initialData={content.contact}
            onSave={handleSaveContact}
          />
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="mt-6 space-y-6 p-6">
          <HoursTabContent
            initialData={content.hours || {}}
            onSave={handleSaveHours}
            orderedDays={orderedDays}
          />
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="mt-6 space-y-6 p-6">
          <Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
                <Video className="h-6 w-6 text-[#D8BD2A]" />
                Apparatus & Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {content.apparatus.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <button
                      onClick={() => removeArrayItem('apparatus', index)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new apparatus"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('apparatus', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button variant="outline">Add</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Side Quests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {content.sideQuests.map((quest, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {quest}
                    <button
                      onClick={() => removeArrayItem('sideQuests', index)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add new side quest"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addArrayItem('sideQuests', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button variant="outline">Add</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="mt-6 space-y-6 p-6">
          <Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
                <Star className="h-6 w-6 text-[#D8BD2A]" />
                Parent Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.testimonials.map((testimonial, index) => (
                <TestimonialForm 
                  key={testimonial.id || index}
                  testimonial={testimonial}
                  index={index}
                  onSave={async (index, updatedTestimonial) => {
                    // First update local state for immediate UI feedback
                    const newTestimonials = [...content.testimonials];
                    newTestimonials[index] = updatedTestimonial;
                    updateContent('testimonials', newTestimonials);
                    
                    // Then save to backend
                    await handleSaveTestimonial(updatedTestimonial, index);
                  }}
                  onRemove={(index) => removeArrayItem('testimonials', index)}
                  onSetFeatured={handleSetFeaturedTestimonial}
                />
              ))}
              <Button
                variant="outline"
                onClick={() => addArrayItem('testimonials', { name: '', text: '', rating: 5 })}
              >
                Add Testimonial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-6 space-y-6 p-6">
          <FAQsTabContent
            initialData={content.faqs}
            onSave={handleSaveFaqs}
          />
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails" className="mt-6 space-y-6 p-6">
          <Card className="rounded-xl border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-[#0F0276] dark:text-white flex items-center gap-3">
                <Mail className="h-6 w-6 text-[#D8BD2A]" />
                Email Template Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Email Templates</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Manage all email templates used throughout the platform. Each template is automatically sent based on specific triggers and events.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Parent Authorization</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent when parents need access codes to login</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Session Confirmation</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent after successful payment confirmation</p>
                    <Badge variant="default" className="text-xs">Automatic</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Session Reminder</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent 24 hours before scheduled sessions</p>
                    <Badge variant="default" className="text-xs">Automatic</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Reschedule Confirmation</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent when bookings are rescheduled</p>
                    <Badge variant="default" className="text-xs">Automatic</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Session Cancellation</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent when sessions are cancelled</p>
                    <Badge variant="destructive" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Birthday Email</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent on athlete birthdays</p>
                    <Badge variant="default" className="text-xs">Automatic</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Waiver Reminder</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent when waivers need completion</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Signed Waiver Confirmation</h5>
                    <p className="text-xs text-gray-600 mb-2">Sent after waiver completion with PDF</p>
                    <Badge variant="default" className="text-xs">Automatic</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Reservation Payment</h5>
                    <p className="text-xs text-gray-600 mb-2">Payment links for new athletes</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Waiver Completion</h5>
                    <p className="text-xs text-gray-600 mb-2">Links for waiver completion</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">Safety Information</h5>
                    <p className="text-xs text-gray-600 mb-2">Important safety information links</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                  <div className="bg-white rounded border p-3">
                    <h5 className="font-medium text-sm mb-1">New Tips/Blog Posts</h5>
                    <p className="text-xs text-gray-600 mb-2">Notifications for new content</p>
                    <Badge variant="secondary" className="text-xs">Manual</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">🔧 Email Template Editing</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Email templates are currently managed as React components in the <code>/emails</code> directory. 
                  To edit email content, styles, or add new templates:
                </p>
                <ol className="text-sm text-yellow-700 space-y-1 ml-4 list-decimal">
                  <li>Navigate to the <code>/workspaces/coach-will-gymnastics-clean/emails/</code> folder</li>
                  <li>Edit the desired <code>.tsx</code> template file</li>
                  <li>Templates use React Email components for styling</li>
                  <li>Changes are automatically applied after server restart</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">📬 Automatic Email Triggers</h4>
                <div className="text-sm text-green-700 space-y-2">
                  <p><strong>Session Reminders:</strong> Sent daily at ~24 hours before scheduled sessions</p>
                  <p><strong>Birthday Emails:</strong> Sent daily for athletes with birthdays on current date</p>
                  <p><strong>Reschedule Confirmations:</strong> Sent immediately when bookings are rescheduled</p>
                  <p><strong>Payment Confirmations:</strong> Sent via Stripe webhook after successful payments</p>
                  <p><strong>Waiver Confirmations:</strong> Sent immediately after waiver completion</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">📋 Available Email Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p><code>BirthdayEmail.tsx</code> - Birthday wishes</p>
                    <p><code>ManualBookingConfirmation.tsx</code> - Manual booking confirmations</p>
                    <p><code>NewTipOrBlog.tsx</code> - Content notifications</p>
                    <p><code>ParentAuthorization.tsx</code> - Login access codes</p>
                    <p><code>RescheduleConfirmation.tsx</code> - Reschedule confirmations</p>
                    <p><code>ReservationPaymentLink.tsx</code> - Payment links</p>
                    <p><code>SafetyInformationLink.tsx</code> - Safety information</p>
                  </div>
                  <div className="space-y-1">
                    <p><code>SessionCancellation.tsx</code> - Cancellation notices</p>
                    <p><code>SessionConfirmation.tsx</code> - Session confirmations</p>
                    <p><code>SessionFollowUp.tsx</code> - Post-session follow-up</p>
                    <p><code>SessionReminder.tsx</code> - Session reminders</p>
                    <p><code>SignedWaiverConfirmation.tsx</code> - Waiver confirmations</p>
                    <p><code>WaiverCompletionLink.tsx</code> - Waiver completion links</p>
                    <p><code>WaiverReminder.tsx</code> - Waiver reminders</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Email Configuration</h4>
                <p className="text-sm text-red-700 mb-2">
                  Email delivery requires proper configuration of the <code>RESEND_API_KEY</code> environment variable.
                </p>
                <p className="text-sm text-red-700">
                  In development mode, emails are logged to the console instead of being sent.
                  Check the server logs to verify email trigger functionality.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Banner Video Preview Dialog */}
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Banner Video Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {content.bannerVideo ? (
              <video 
                controls 
                className="w-full h-full object-cover rounded-lg"
                preload="metadata"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Preview video error:', e);
                  console.log('Video src in preview:', content.bannerVideo);
                }}
                onLoadStart={() => {
                  console.log('Preview video load started for:', content.bannerVideo);
                }}
              >
                <source 
                  src={content.bannerVideo} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No video available to preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}