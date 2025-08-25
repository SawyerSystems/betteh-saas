import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Users, UserPlus, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Parent, Athlete } from '@shared/schema';

const identificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

type IdentificationData = z.infer<typeof identificationSchema>;

interface ParentIdentificationProps {
  onParentIdentified: (parent: any, athletes: any[], lastFocusAreas?: string[]) => void;
  onNewParent: () => void;
}

export function ParentIdentification({ onParentIdentified, onNewParent }: ParentIdentificationProps) {
  const [parentType, setParentType] = useState<'returning' | 'new' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);

  const form = useForm<IdentificationData>({
    resolver: zodResolver(identificationSchema),
    defaultValues: {
      email: '',
      phone: '',
    },
  });

  const handleReturningParent = async (data: IdentificationData) => {
    setIsLoading(true);
    setNotFoundMessage(null);
    
    try {
      const response = await apiRequest('POST', '/api/identify-parent', data);
      const result = await response.json();
      
      if (result.found) {
        onParentIdentified(result.parent, result.athletes, result.lastFocusAreas);
      } else {
        setNotFoundMessage(
          `We couldn't find an account with email "${data.email}" and phone "${data.phone}". ` +
          `Please check your information or sign up as a new parent.`
        );
      }
    } catch (error) {
      setNotFoundMessage('There was an error looking up your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (parentType === null) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Coach Will Tumbles!</h2>
          <p className="text-gray-600">Are you a new or returning parent?</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
            onClick={() => setParentType('returning')}
          >
            <CardHeader className="text-center">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Returning Parent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                I've booked with Coach Will before and want to use my existing information
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-300"
            onClick={() => {
              setParentType('new');
              onNewParent();
            }}
          >
            <CardHeader className="text-center">
              <UserPlus className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">New Parent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                This is my first time booking with Coach Will
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (parentType === 'returning') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Please enter your email and phone number to find your account</p>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Find Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReturningParent)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <Input 
                        {...field} 
                        type="email"
                        placeholder="parent@example.com"
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <Input 
                        {...field} 
                        type="tel"
                        placeholder="(555) 123-4567"
                        disabled={isLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {notFoundMessage && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">{notFoundMessage}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setParentType(null)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Searching...' : (
                      <>
                        Find Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => {
              setParentType('new');
              onNewParent();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Don't have an account? Sign up as a new parent →
          </Button>
        </div>
      </div>
    );
  }

  return null;
}