import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if already logged in
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: () => apiRequest('GET', '/api/auth/status').then(res => res.json()),
  });

  // Redirect if already logged in using useEffect to avoid state update during render
  useEffect(() => {
    if (authStatus?.loggedIn) {
      setLocation('/admin');
    }
  }, [authStatus?.loggedIn, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Login Successful',
        description: 'Welcome to the admin dashboard!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      setLocation('/admin');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen theme-smooth flex items-center justify-center bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black p-4">
      <SEOHead
        title="Admin Login — Coach Will Tumbles"
        description="Administrator sign in."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/admin-login` : 'https://www.coachwilltumbles.com/admin-login'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <Card className="w-full max-w-md border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-[#D8BD2A]/20 border border-slate-200/60 dark:border-[#D8BD2A]/40">
            <Shield className="h-6 w-6 text-[#0F0276] dark:text-[#D8BD2A]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#0F0276] dark:text-white">Admin Login</CardTitle>
          <p className="text-sm text-slate-600 dark:text-white/80">
            Sign in to access the admin dashboard
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email"                  
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#0F0276] hover:bg-[#0F0276]/90 text-white dark:bg-[#D8BD2A] dark:hover:bg-[#D8BD2A]/90 dark:text-[#0F0276] font-semibold transition-all duration-200"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <img 
                      src="/CWT_Circle_LogoSPIN.png" 
                      alt="Loading" 
                      className="mr-2 h-4 w-4 animate-spin" 
                    />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
          

        </CardContent>
      </Card>
    </div>
  );
}