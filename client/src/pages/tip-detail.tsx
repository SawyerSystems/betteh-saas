import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDateField } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import { Tip } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link, useParams } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function TipDetail() {
  const { id } = useParams();
  
  const { data: tip, isLoading, error } = useQuery<Tip>({
    queryKey: ['/api/tips', id],
    queryFn: async () => {
      console.log(`Fetching tip with ID: ${id}`);
      try {
        const response = await apiRequest('GET', `/api/tips/${id}`);
        if (!response.ok) {
          console.error(`Error fetching tip: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch tip: ${response.status}`);
        }
        const data = await response.json();
        console.log('Tip data received:', data);
        return data;
      } catch (error) {
        console.error('Tip fetch error:', error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tip) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Tip Not Found</h1>
            <p className="text-slate-700 dark:text-slate-300 mb-8">Sorry, we couldn't find the tip you're looking for.</p>
            <Link href="/tips">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tips
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black py-20">
      <SEOHead
        title={`${tip.title} | Gymnastics Tip | Coach Will Tumbles`}
        description={(tip.sections?.[0]?.content || tip.content || '').slice(0, 160)}
        canonicalUrl={`https://www.coachwilltumbles.com/tips/${tip.id}`}
        robots="index,follow"
        structuredData={{
          "@context": "https://schema.org",
          "@type": tip.sections && tip.sections.length > 0 ? "HowTo" : "Article",
          name: tip.title,
          description: (tip.sections?.[0]?.content || tip.content || '').slice(0, 200),
          url: `https://www.coachwilltumbles.com/tips/${tip.id}`,
          step: (tip.sections || []).map((s: any, i: number) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.content }))
        }}
      />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/tips">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tips
            </Button>
          </Link>

          <Card className="glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{tip.category}</Badge>
                <Badge 
                  variant={tip.difficulty === 'Beginner' ? 'default' : 
                          tip.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                >
                  {tip.difficulty}
                </Badge>
              </div>
              
              <CardTitle className="text-3xl mb-4 text-slate-900 dark:text-slate-100">{tip.title}</CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(getDateField(tip, ['published_at', 'publishedAt']), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="prose prose-lg max-w-none">
                {/* Sections */}
                {tip.sections && tip.sections.length > 0 ? (
                  <div className="space-y-8">
                    {tip.sections
                      .filter(section => section.title !== 'TEXT') // Filter out TEXT sections
                      .map((section, index) => (
                      <div key={index} className="border-l-4 border-purple-400 pl-6">
                        {/* Only show section title if it's not 'TEXT' */}
                        {section.title !== 'TEXT' && (
                          <h3 className="text-xl font-semibold mb-4 text-purple-700 dark:text-purple-300">
                            {section.title}
                          </h3>
                        )}
                        
                        {section.imageUrl && (
                          <div className="mb-4">
                            <img 
                              src={section.imageUrl} 
                              alt={section.title}
                              className="w-full max-w-md rounded-lg shadow-md"
                            />
                          </div>
                        )}
                        
                        <div className="mb-4">
                          {section.content.split('\n').map((paragraph, pIndex) => {
                            if (paragraph.trim() === '') return null;
                            
                            if (paragraph.startsWith('- ')) {
                              return (
                                <li key={pIndex} className="ml-4 mb-1 text-slate-800 dark:text-slate-200">
                                  {paragraph.slice(2)}
                                </li>
                              );
                            }
                            
                            return (
                              <p key={pIndex} className="mb-3 leading-relaxed text-slate-800 dark:text-slate-200">
                                {paragraph}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback to original content display if no sections
                  <div className="leading-relaxed text-slate-800 dark:text-slate-200">
                    {tip.content ? tip.content.split('\n').map((paragraph, index) => {
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-purple-800 dark:text-purple-300">
                            {paragraph.slice(2, -2)}
                          </h3>
                        );
                      } else if (paragraph.startsWith('- ')) {
                        return (
                          <li key={index} className="ml-4 mb-1">
                            {paragraph.slice(2)}
                          </li>
                        );
                      } else if (paragraph.trim() === '') {
                        return <br key={index} />;
                      } else {
                        return (
                          <p key={index} className="mb-4 leading-relaxed">
                            {paragraph}
                          </p>
                        );
                      }
                    }) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">Content not available.</p>
                    )}
                  </div>
                )}
              </div>

              {tip.videoUrl && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Practice Video</h3>
                  <div className="aspect-video">
                    <iframe
                      src={tip.videoUrl}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Link href="/tips">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                View More Tips
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}