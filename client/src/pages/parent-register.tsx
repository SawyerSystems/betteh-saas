import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone is required'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function ParentRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
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

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest('POST', '/api/parent-auth/register', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Registration Successful',
        description: 'An email has been sent with instructions to verify your account.',
      });
      
      // Redirect to the parent setup success page with the email
      const emailParam = encodeURIComponent(variables.email);
      setLocation(`/parent-setup-success?email=${emailParam}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen theme-smooth flex items-center justify-center bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black p-4">
      <SEOHead
        title="Parent Registration — Coach Will Tumbles"
        description="Create your parent account to book lessons."
        canonicalUrl={typeof window !== 'undefined' ? `${window.location.origin}/parent-register` : 'https://www.coachwilltumbles.com/parent-register'}
        robots="noindex,follow"
        structuredData={{ "@context": "https://schema.org", "@type": "WebPage" }}
      />
      <Card className="w-full max-w-md border border-slate-200/60 bg-white/70 supports-[backdrop-filter]:bg-white/40 backdrop-blur-md dark:border-[#2A4A9B]/60 dark:bg-[#0F0276]/90 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <img 
              src="/assets/betteh_logo_black_font.png" 
              alt="Coach Will Tumbles" 
              className="h-16 w-16"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#0F0276] dark:text-white">Parent Registration</CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Create your parent account to book lessons
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
                      <Input type="email" placeholder="parent@example.com" {...field} />
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
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Phone Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Emergency Contact Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Emergency Contact Phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-[#0F0276] hover:bg-[#0F0276]/90 dark:bg-[#D8BD2A] dark:text-[#0F0276] dark:hover:bg-[#D8BD2A]/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <img 
                      src="/assets/betteh_logo_black_font.png" 
                      alt="Loading" 
                      className="mr-2 h-4 w-4 animate-spin" 
                    />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              className="text-[#0F0276] hover:text-[#0F0276]/80 dark:text-[#D8BD2A] dark:hover:text-[#D8BD2A]/80 font-medium transition-colors"
              onClick={() => setLocation('/parent/login')}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
