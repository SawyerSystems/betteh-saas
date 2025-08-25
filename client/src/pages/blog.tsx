import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { BlogPost, Parent } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Calendar, CheckCircle, Filter, Mail, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [guestEmail, setGuestEmail] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: authStatus } = useQuery<{ loggedIn: boolean; parentId?: number; email?: string }>({
    queryKey: ["/api/parent-auth/status"],
  });

  // Get parent info if authenticated
  const { data: parentInfo } = useQuery<Parent>({
    queryKey: ["/api/parent/info"],
    enabled: authStatus?.loggedIn === true,
  });

  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
  });

  // Mutation for parent blog email opt-in
  const parentOptInMutation = useMutation({
    mutationFn: async (optIn: boolean) => {
      const response = await apiRequest("PATCH", "/api/parent/blog-email-opt-in", { optIn });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/info"] });
      setSubscriptionMessage(data.message);
      setTimeout(() => setSubscriptionMessage(""), 5000);
    },
    onError: (error) => {
      setSubscriptionMessage("Failed to update subscription preference. Please try again.");
      setTimeout(() => setSubscriptionMessage(""), 5000);
    },
  });

  // Mutation for guest email signup
  const guestSignupMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/blog-email-signup", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setGuestEmail("");
      setSubscriptionMessage(data.message);
      setTimeout(() => setSubscriptionMessage(""), 5000);
    },
    onError: (error: any) => {
      setSubscriptionMessage(error.message || "Failed to subscribe. Please try again.");
      setTimeout(() => setSubscriptionMessage(""), 5000);
    },
  });

  // Handle subscription actions
  const handleParentOptInChange = (checked: boolean) => {
    parentOptInMutation.mutate(checked);
  };

  const handleGuestSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestEmail.trim()) {
      guestSignupMutation.mutate(guestEmail.trim());
    }
  };

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    if (!posts) return [];

    let filtered = posts;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(post => 
        post.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [posts, searchTerm, selectedCategory, sortOrder]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!posts) return {};
    
    const counts: Record<string, number> = { all: posts.length };
    posts.forEach(post => {
      const category = post.category.toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [posts]);

  if (error) {
    return (
      <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Unable to Load Blog Posts</h2>
          <p className="text-slate-700 dark:text-slate-300">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-smooth bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black">
  <SEOHead
        title="Gymnastics Tips & Stories | Coach Will Tumbles Blog"
        description="Training tips, stories, and parent-friendly guides to help young athletes grow with confidence at Coach Will Tumbles."
        canonicalUrl="https://www.coachwilltumbles.com/blog"
        robots="index,follow"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.coachwilltumbles.com/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.coachwilltumbles.com/blog" }
            ]
          },
          {
            "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Coach Will Tumbles Blog",
    url: "https://www.coachwilltumbles.com/blog",
    description: "Gymnastics tips, stories, and guides for parents and athletes."
          }
        ]}
      />
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-slate-800/40 dark:via-slate-900/30 dark:to-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Adventure <span className="text-orange-600">Stories</span>
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            Stories, insights, and guides for every step of your athlete's flippin' adventure. 
            Explore training tips, celebrate victories, and discover new ways to grow.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24 bg-white dark:bg-slate-900/30">
        <div className="container mx-auto px-4">
          <div className="lg:flex gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 mb-8 lg:mb-0">
              <div className="space-y-8 sticky top-8">
                {/* Search */}
                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search articles"
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Card>

                {/* Sort Filter */}
                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-orange-600" />
                    Sort Posts
                  </h3>
                  <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
                    <SelectTrigger className="w-full hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                      <SelectValue placeholder="Sort by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                          Most Recent First
                        </span>
                      </SelectItem>
                      <SelectItem value="oldest">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                          Oldest First
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Card>

                {/* Categories */}
                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-purple-600" />
                    Categories
                  </h3>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center justify-between cursor-pointer transition-colors duration-200 p-2 rounded-md ${
                        selectedCategory === "all" 
                          ? "text-purple-600 bg-purple-50" 
                          : "text-slate-600 hover:text-slate-800 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                      }`}
                      onClick={() => setSelectedCategory("all")}
                    >
                      <span className="font-medium">All Posts</span>
                      <Badge 
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        className={selectedCategory === "all" ? "bg-purple-600 text-white" : ""}
                      >
                        {categoryCounts.all || 0}
                      </Badge>
                    </div>
                    {Object.entries(categoryCounts)
                      .filter(([category]) => category !== "all")
                      .map(([category, count]) => (
                        <div 
                          key={category}
                          className={`flex items-center justify-between cursor-pointer transition-colors duration-200 p-2 rounded-md ${
                            selectedCategory === category 
                              ? "text-purple-600 bg-purple-50" 
                              : "text-slate-600 hover:text-slate-800 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800/50"
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          <span className="font-medium capitalize">{category}</span>
                          <Badge 
                            variant={selectedCategory === category ? "default" : "outline"}
                            className={selectedCategory === category ? "bg-purple-600 text-white" : ""}
                          >
                            {count}
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                </Card>

                {/* Newsletter */}
                <Card className="p-6 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800/40 dark:to-slate-900/50">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Stay Updated
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                    Get the latest gymnastics tips and stories delivered to your inbox!
                  </p>
                  
                  {subscriptionMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-emerald-900/30 border border-green-200 dark:border-emerald-800">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <p className="text-sm text-green-800 dark:text-emerald-200">{subscriptionMessage}</p>
                      </div>
                    </div>
                  )}

                  {authStatus?.loggedIn ? (
                    // Authenticated parent - show checkbox for opt-in
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="blog-emails"
                          checked={false}
                          onCheckedChange={handleParentOptInChange}
                          disabled={parentOptInMutation.isPending}
                        />
                        <label 
                          htmlFor="blog-emails" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Subscribe to blog notifications
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Notifications will be sent to {parentInfo?.email}
                      </p>
                      {parentOptInMutation.isPending && (
                        <p className="text-xs text-purple-600">Updating preference...</p>
                      )}
                    </div>
                  ) : (
                    // Unauthenticated user - show email input
          <form onSubmit={handleGuestSignup} className="space-y-3">
                      <Input 
                        type="email" 
                        placeholder="Enter your email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
            className="bg-white dark:bg-slate-900/50"
                        disabled={guestSignupMutation.isPending}
                        required
                      />
                      <Button 
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={guestSignupMutation.isPending || !guestEmail.trim()}
                      >
                        {guestSignupMutation.isPending ? "Subscribing..." : "Subscribe"}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
                <div>
          <p className="text-slate-700 dark:text-slate-300">
                    Showing {filteredAndSortedPosts.length} of {posts?.length || 0} articles
                  </p>
                  {(searchTerm || selectedCategory !== "all") && (
                    <div className="flex items-center gap-2 mt-2">
                      {searchTerm && (
                        <Badge variant="outline" className="text-xs">
                          Search: "{searchTerm}"
                        </Badge>
                      )}
                      {selectedCategory !== "all" && (
                        <Badge variant="outline" className="text-xs">
                          Category: {selectedCategory}
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${sortOrder === "newest" ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"}`}
                >
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </Badge>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {[...Array(6)].map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <Skeleton className="w-full h-48" />
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
              ) : filteredAndSortedPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-8">
                  {filteredAndSortedPosts.map((post, index) => (
                    <Card 
                      key={post.id} 
          className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 glass-surface glass-card glass-gradient border border-slate-200 dark:border-slate-700"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {post.imageUrl && (
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                                month: 'long', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              Coach Will
                            </span>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              post.category === 'Tips' ? 'bg-blue-100 text-blue-800' :
                              post.category === 'Story' ? 'bg-purple-100 text-purple-800' :
                              'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {post.category === 'Tips' ? 'tips' : 
                             post.category === 'Story' ? 'stories' : 'exercises'}
                          </Badge>
                        </div>
                        
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        
        <p className="text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">5 min read</span>
                          <Link href={`/blog/${post.id}`}>
                            <Button 
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              Read More
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
        <div className="text-center py-16">
                  {posts && posts.length > 0 ? (
                    // No results from filters
                    <div className="max-w-md mx-auto">
          <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Search className="h-8 w-8 text-orange-600" />
                      </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">No Results Found</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-6">
                        No blog posts match your current filters. Try adjusting your search or category selection.
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    // No posts at all
                    <div className="max-w-md mx-auto">
          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">No Blog Posts Yet</h3>
          <p className="text-slate-700 dark:text-slate-300">Check back soon for gymnastics tips, stories, and updates!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection 
        title="Join the Adventure"
        subtitle="Ready to start your child's gymnastics journey? Book a lesson with Coach Will and watch them flip, tumble, and grow!"
        primaryButtonText="Book a Lesson"
        primaryButtonLink="/booking-demo"
        secondaryButtonText="Get in Touch"
        secondaryButtonLink="/contact"
        features={[
          "Expert coaching",
          "Age-appropriate training",
          "Safe environment",
          "Flexible scheduling"
        ]}
      />

  <Footer />
    </div>
  );
}
