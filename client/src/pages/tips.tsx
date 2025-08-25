import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Play, BookOpen, Award, Filter, ArrowRight } from "lucide-react";
import type { Tip } from "@shared/schema";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Tips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const { data: tips, isLoading, error } = useQuery<Tip[]>({
    queryKey: ["/api/tips"],
  });

  const filteredTips = tips?.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || tip.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || tip.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = Array.from(new Set(tips?.map(tip => tip.category) || []));
  const difficulties = Array.from(new Set(tips?.map(tip => tip.difficulty) || []));

  if (error) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Unable to Load Tips</h2>
          <p className="text-slate-700 dark:text-slate-300">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
      <SEOHead
        title="Gymnastics Tips, Drills, and How-Tos | Coach Will Tumbles"
        description="Browse training tips and drills for floor, bars, beam, and vault. Parent-friendly guidance to build strength, skill, and confidence."
        canonicalUrl="https://www.coachwilltumbles.com/tips"
        robots="index,follow"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.coachwilltumbles.com/" },
              { "@type": "ListItem", position: 2, name: "Tips", item: "https://www.coachwilltumbles.com/tips" }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Gymnastics Tips",
            description: "A curated collection of gymnastics training tips and drills.",
            url: "https://www.coachwilltumbles.com/tips"
          }
        ]}
      />
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Training <span className="text-teal-600">Adventures</span>
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            Discover new skills and level up your flippin' adventure with our collection of tips, drills, and techniques. 
            Every skill is a new quest waiting to be conquered.
          </p>
          
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/30 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 glass-surface glass-card glass-gradient">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search tips and drills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Grid */}
      <section className="py-16 lg:py-24 bg-white dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTips && filteredTips.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-slate-700 dark:text-slate-300">
                  Showing {filteredTips.length} of {tips?.length || 0} tips
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTips.map((tip) => (
                  <Card key={tip.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge 
                          variant="secondary"
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            tip.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                            tip.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {tip.difficulty.charAt(0).toUpperCase() + tip.difficulty.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tip.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
                        {tip.title}
                      </h3>
                      
                      <p className="text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                        {tip.content ? `${tip.content.substring(0, 150)}...` : 'No content available'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(tip.publishedAt).toLocaleDateString()}
                        </span>
                        <Link href={`/tips/${tip.id}`}>
                          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800 hover:bg-purple-50">
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Continue reading
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Filter className="h-16 w-16 text-gray-300 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {searchTerm || categoryFilter !== "all" || difficultyFilter !== "all" 
                  ? "No tips match your search" 
                  : "No tips available yet"
                }
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                {searchTerm || categoryFilter !== "all" || difficultyFilter !== "all"
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Check back soon for gymnastics tips and drills!"
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Skill Categories */}
  <section className="py-16 lg:py-24 bg-gray-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Skill <span className="text-purple-600">Categories</span>
            </h2>
    <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
              Explore tips organized by gymnastics apparatus and skill types.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Floor Skills",
                description: "Tumbling, cartwheels, handstands, and floor routines",
                icon: "🤸‍♀️",
                color: "from-blue-50 to-blue-100 border-blue-200"
              },
              {
                name: "Bars",
                description: "Pull-ups, cast, glide swings, and bar routines",
                icon: "🏅",
                color: "from-purple-50 to-purple-100 border-purple-200"
              },
              {
                name: "Beam",
                description: "Balance, leaps, turns, and beam sequences",
                icon: "⚖️",
                color: "from-teal-50 to-teal-100 border-teal-200"
              },
              {
                name: "Vault & Tumbling",
                description: "Running, jumping, and advanced tumbling skills",
                icon: "🏃‍♀️",
                color: "from-orange-50 to-orange-100 border-orange-200"
              }
            ].map((category, index) => (
              <Card 
                key={index} 
                className={`p-6 text-center hover:shadow-lg transition-shadow duration-300 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700 cursor-pointer`}
                onClick={() => setCategoryFilter(category.name)}
              >
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{category.name}</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection 
        title="Ready to Master These Skills?"
        subtitle="Join Coach Will's gymnastics program where every training adventure builds confidence, strength, and technique!"
        primaryButtonText="Start Their Journey"
        primaryButtonLink="/booking-demo"
        secondaryButtonText="View Class Schedule"
        secondaryButtonLink="/contact"
        features={[
          "Expert skill progression",
          "Safe training environment", 
          "Personalized technique coaching",
          "Fun skill challenges"
        ]}
        variant="secondary"
      />

  <Footer />
    </div>
  );
}
