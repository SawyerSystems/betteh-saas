import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Award, CheckCircle, Heart, Star, Users } from "lucide-react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function About() {
  // Fetch dynamic site content
  const { data: siteContent, isLoading } = useQuery({
    queryKey: ["/api/site-content"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/site-content");
      const data = await response.json();
      console.log("[DEBUG-CLIENT] Site content response:", { 
        hasAbout: !!data.about,
        aboutPhoto: data.about?.photo,
        aboutKeys: data.about ? Object.keys(data.about) : []
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-64 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const aboutData = siteContent?.about || {
    bio: 'Coach Will brings nearly 10 years of passionate gymnastics instruction to every lesson.',
    experience: 'Nearly 10 years of coaching experience with athletes of all levels',
    photo: '',  // Add empty photo field to default fallback
    certifications: [
      { title: 'USA Gymnastics Certified', body: 'Official certification from USA Gymnastics' },
      { title: 'CPR/First Aid Certified', body: 'Current safety and emergency response training' },
      { title: 'Background Checked', body: 'Comprehensive background verification completed' }
    ]
  };
  
  // Debug the about data we're actually using
  console.log("[DEBUG-CLIENT] About data being rendered:", {
    hasPhoto: !!aboutData.photo,
    photo: aboutData.photo,
    keys: Object.keys(aboutData)
  });

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
      <SEOHead
        title="About Coach Will | Private Gymnastics Coaching in Oceanside, CA"
        description={aboutData.bio}
        canonicalUrl="https://www.coachwilltumbles.com/about"
        robots="index,follow"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.coachwilltumbles.com/" },
              { "@type": "ListItem", position: 2, name: "About", item: "https://www.coachwilltumbles.com/about" }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Coach Will Tumbles",
            url: "https://www.coachwilltumbles.com/about",
            image: aboutData.photo || undefined,
            description: aboutData.bio
          }
        ]}
      />
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Meet <span className="text-purple-600 dark:text-[#D8BD2A]">Coach Will</span>
              </h1>
              <p className="text-lg text-slate-700 dark:text-white mb-6 leading-relaxed">
                {aboutData.bio}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {aboutData.certifications.map((cert: any, index: number) => {
                  const colors = ['purple', 'red', 'green', 'blue'];
                  const icons = [Award, Heart, CheckCircle, Star];
                  const color = colors[index % colors.length];
                  const Icon = icons[index % icons.length];
                  
                  return (
                    <div key={index} className={`bg-gradient-to-br from-${color}-100 to-${color === 'red' ? 'pink' : color === 'green' ? 'emerald' : color}-200 p-4 rounded-xl shadow-md transform hover:scale-105 transition-all duration-200 dark:bg-slate-800/50 dark:backdrop-blur` }>
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-${color}-600 rounded-full flex items-center justify-center shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold text-${color}-800 dark:text-${color}-200 uppercase`}>{cert.title}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-[#0F0276]">{cert.body}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/booking">
                <Button className="btn-athletic-red text-white px-8 py-4 rounded-lg font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-lg">
                  Start Your Journey
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img 
                src={aboutData.photo || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
                alt="Coach Will" 
                className="rounded-2xl shadow-2xl w-full h-auto object-cover" 
              />
              
              {/* Floating testimonial */}
              {siteContent?.testimonials?.find((t: any) => t.featured) ? (
                <Card className="absolute -bottom-6 -left-6 max-w-xs shadow-xl glass-surface glass-card glass-gradient dark:bg-[#D8BD2A]/20 dark:border dark:border-[#D8BD2A]/40 border border-slate-200 dark:border-[#D8BD2A]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex space-x-1">
                        {[...Array(siteContent.testimonials.find((t: any) => t.featured)?.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Review</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      "{siteContent.testimonials.find((t: any) => t.featured)?.text}"
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">- {siteContent.testimonials.find((t: any) => t.featured)?.name}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="absolute -bottom-6 -left-6 max-w-xs shadow-xl glass-surface glass-card glass-gradient dark:bg-[#D8BD2A]/20 dark:border dark:border-[#D8BD2A]/40 border border-slate-200 dark:border-[#D8BD2A]/40">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Parent Review</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      "My daughter absolutely loves her lessons with Coach Will! 
                      She's gained so much confidence and skill."
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">- Sarah M.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              My Coaching <span className="text-blue-600 dark:text-[#FB2832]">Philosophy</span>
            </h2>
            <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Every child is unique, and my approach reflects that. I believe in creating a positive, 
              encouraging environment where kids can learn, grow, and most importantly, have fun.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-blue-300 mb-3">Fun First</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Gymnastics should be exciting. I create a positive environment where kids are excited to learn new skills every week.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-purple-300 mb-3">Individual Focus</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Every athlete gets personalized attention and drills tailored to their age, skill level, and learning style.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-teal-300 mb-3">Progressive Development</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Skills build on skills. We focus on mastering each movement so your child gains confidence with every step.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Experience & <span className="text-teal-600 dark:text-[#D8BD2A]">Qualifications</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-blue-300 mb-3">Certified Gymnastics Coach</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  USA Gymnastics certified with training in developmental progressions and safety.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-purple-300 mb-3">Experience</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  {aboutData.experience}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-teal-300 mb-2">Competition Background</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Has worked with athletes preparing for shows and competitions in multiple states and formats.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-orange-300 mb-3">Youth Development Focus</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Specialized in building confidence and consistency in young athletes.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Certifications */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">Certifications & Training</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aboutData.certifications.map((cert: any, index: number) => {
                const colors = ['blue', 'purple', 'teal', 'orange'];
                const color = colors[index % colors.length];
                const icons = [Award, CheckCircle, Heart, Star];
                const Icon = icons[index % icons.length];
                
                return (
          <Card key={index} className={`text-center p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-${color}-50 to-${color}-100 border-2 border-${color}-200 dark:from-slate-800/80 dark:to-slate-800/50 dark:border-${color}-900/30 glass-card`}>
                    <CardContent className="pt-4">
                      <div className={`w-14 h-14 bg-${color}-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h4 className={`font-bold text-${color}-800 dark:text-${color}-300 mb-2 text-sm uppercase tracking-wide`}>
                        {cert.title}
                      </h4>
            <p className="text-slate-700 dark:text-white text-xs">
                        {cert.body}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-white dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              What Parents <span className="text-orange-600">Say</span>
            </h2>
          </div>

          {/* Featured Testimonial */}
          {siteContent?.testimonials?.find((t: any) => t.featured) && (
            <div className="mb-16">
        <Card className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 dark:bg-[#D8BD2A]/15 dark:border-[#D8BD2A]/40 dark:ring-1 dark:ring-[#D8BD2A]/30 glass-card">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-6">
                    {[...Array(siteContent.testimonials.find((t: any) => t.featured)?.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg text-blue-700 dark:text-[#0F0276] mb-6 italic">
                    "{siteContent.testimonials.find((t: any) => t.featured)?.text}"
                  </p>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {siteContent.testimonials.find((t: any) => t.featured)?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
            <p className="font-semibold text-slate-900 dark:text-slate-900 text-lg">
                        {siteContent.testimonials.find((t: any) => t.featured)?.name}
                      </p>
            <p className="text-orange-600 dark:text-[#D8BD2A] font-medium">Featured Parent Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Regular Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {siteContent?.testimonials?.filter((t: any) => !t.featured).length > 0 ? (
              siteContent.testimonials.filter((t: any) => !t.featured).slice(0, 3).map((testimonial: any, index: number) => (
                <Card key={index} className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.name}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Parent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Fallback testimonials if no dynamic content available
              <>
                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      "Coach Will has been amazing with our daughter Emma. She went from being afraid 
                      of cartwheels to confidently doing back handsprings in just 6 months!"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        S
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Sarah Johnson</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Emma's Mom</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      "My twins love their semi-private lessons. Coach Will makes learning fun while 
                      keeping them challenged. Highly recommend!"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        M
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Maria Rodriguez</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Alex & Sam's Mom</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                      "The best investment we've made for our son's confidence and physical development. 
                      Coach Will is patient, encouraging, and truly cares about each child."
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                        D
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">David Chen</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Lily's Dad</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Meet Coach Will?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Schedule your athlete's first lesson today and see why families trust Coach Will's approach to gymnastics and growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button 
                size="lg"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-all duration-200 shadow-lg hover:bg-gray-100"
              >
                Start Journey
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transform transition-all duration-200 shadow-lg"
              >
                Ask Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
