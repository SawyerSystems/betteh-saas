import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { z } from 'zod';
import SEOHead from '@/components/SEOHead';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest('POST', '/api/parent-auth/forgot-password', data);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <SEOHead 
          title="Password Reset Email Sent"
          description="Check your email for password reset instructions"
        />
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl border-0 dark:bg-gray-900/80">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Check Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                We've sent password reset instructions to <strong>{form.getValues('email')}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If you don't see the email in your inbox, check your spam folder. The reset link will expire in 24 hours.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/parent/login')}
                className="w-full bg-[#0F0276] hover:bg-[#0F0276]/90 dark:bg-[#D8BD2A] dark:text-[#0F0276] dark:hover:bg-[#D8BD2A]/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                className="w-full border-[#0F0276] text-[#0F0276] hover:bg-[#0F0276] hover:text-white dark:border-[#D8BD2A] dark:text-[#D8BD2A] dark:hover:bg-[#D8BD2A] dark:hover:text-[#0F0276] font-medium transition-colors"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Another Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-smooth flex items-center justify-center bg-gradient-to-b from-[#D8BD2A]/10 via-white to-[#0F0276]/5 dark:from-[#0F0276]/40 dark:via-[#0F0276]/20 dark:to-black p-4">
      <SEOHead 
        title="Forgot Password"
        description="Reset your password to regain access to your parent portal"
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
          <CardTitle className="text-2xl font-bold text-[#0F0276] dark:text-white">
            Forgot Your Password?
          </CardTitle>
          <p className="text-slate-600 dark:text-white/80 mt-2">
            No worries! Enter your email address and we'll send you a link to reset your password.
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
                    <FormLabel>Email Address</FormLabel>
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
              <Button 
                type="submit" 
                className="w-full bg-[#0F0276] hover:bg-[#0F0276]/90 dark:bg-[#D8BD2A] dark:text-[#0F0276] dark:hover:bg-[#D8BD2A]/90 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <img 
                      src="/assets/betteh_logo_black_font.png" 
                      alt="Loading" 
                      className="mr-2 h-4 w-4 animate-spin" 
                    />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
