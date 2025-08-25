import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function ParentLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if already logged in
  const { data: authStatus } = useQuery({
    queryKey: ['/api/parent-auth/status'],
    queryFn: () => apiRequest('GET', '/api/parent-auth/status').then(res => res.json()),
  });

  useEffect(() => {
    if (authStatus?.loggedIn) {
      setLocation('/parent-dashboard');
    }
  }, [authStatus?.loggedIn, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest('POST', '/api/parent-auth/login', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate auth status query to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['/api/parent-auth/status'] });
      toast({
        title: 'Login Successful',
        description: 'Welcome to your parent dashboard!',
      });
      setLocation('/parent-dashboard');
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
        title="Parent Login — Coach Will Tumbles"
        description="Sign in to your parent account."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/parent-login` : window.location.origin + '/parent-login'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <Card className="w-full max-w-md border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-[#D8BD2A]/20 border border-slate-200/60 dark:border-[#D8BD2A]/40">
            <Lock className="h-6 w-6 text-[#0F0276] dark:text-[#D8BD2A]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#0F0276] dark:text-white">Parent Login</CardTitle>
          <p className="text-sm text-slate-600 dark:text-white/80">
            Sign in to access your parent dashboard
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
                        placeholder="parent@example.com"
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
                      src="/assets/betteh_logo_black_font.png" 
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
          
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-white/80 mb-3">
              Don't have an account?
            </p>
            <Button 
              variant="outline" 
              className="w-full border-slate-200 bg-white/50 hover:bg-slate-50 text-[#0F0276] dark:border-[#2A4A9B]/40 dark:bg-[#0F0276]/20 dark:hover:bg-[#0F0276]/30 dark:text-white"
              onClick={() => setLocation('/parent-register')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Create New Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}