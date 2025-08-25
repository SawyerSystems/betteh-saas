import { Button } from "@/components/ui/button";
import { ParentModal } from "@/components/parent-ui/ParentModal";
import { ParentFormInput } from "@/components/parent-ui/ParentFormComponents";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface BookingLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (parentData: any) => void;
}

export function BookingLoginModal({ isOpen, onClose, onLoginSuccess }: BookingLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/parent-auth/login", { 
        email, 
        password 
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Also authenticate into main site if parent has admin access
        try {
          await apiRequest("POST", "/api/auth/parent-cross-auth", { 
            parentId: data.parentId,
            parentEmail: data.parentEmail 
          });
        } catch (crossAuthError) {
          // Cross-auth failed but parent auth succeeded, continue
          console.log("Cross-auth failed:", crossAuthError);
        }
        
        toast({
          title: "Welcome back!",
          description: "Login successful"
        });
        
        // Invalidate auth queries to refresh navbar immediately
        queryClient.invalidateQueries({ queryKey: ['/api/parent-auth/status'] });
        
        // Create parent object from login response
        const parentData = {
          id: data.parentId,
          email: data.parentEmail
        };
        
        // Fetch complete parent information and athletes
        try {
          const [parentInfoResponse, athletesResponse] = await Promise.all([
            apiRequest("GET", "/api/parent/info"),
            apiRequest("GET", "/api/parent/athletes")
          ]);
          
          if (parentInfoResponse.ok && athletesResponse.ok) {
            const completeParentInfo = await parentInfoResponse.json();
            const athletes = await athletesResponse.json();
            
            console.log("🔍 DEBUG - Athletes data:", athletes);
            console.log("🔍 DEBUG - Athletes waiver status:", athletes.map((a: any) => ({ 
              id: a.id, 
              name: a.name, 
              waiverSigned: a.waiverSigned 
            })));
            
            // Check if any athlete has waiver signed (at least one athlete can participate)
            const hasSignedWaivers = athletes.some((athlete: any) => athlete.waiverSigned);
            
            console.log("🔍 DEBUG - Has signed waivers:", hasSignedWaivers);
            
            // Add waiver status to parent data
            const parentWithWaiverStatus = {
              ...completeParentInfo,
              waiverSigned: hasSignedWaivers
            };
            
            console.log("🔍 DEBUG - Parent with waiver status:", parentWithWaiverStatus);
            
            onLoginSuccess(parentWithWaiverStatus);
          } else {
            // Fallback to basic parent data if full info fetch fails
            onLoginSuccess(parentData);
          }
        } catch (fetchError) {
          console.warn("Failed to fetch complete parent info, using basic data:", fetchError);
          onLoginSuccess(parentData);
        }
        
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.error || "Invalid email or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewParent = () => {
    onClose();
    setLocation('/parent-register');
  };

  return (
    <ParentModal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Parent Login"
      description="Sign in to continue with your booking"
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <ParentFormInput
            id="email"
            type="email"
            placeholder="parent@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <ParentFormInput
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <Button 
          onClick={handleLogin} 
          className="w-full bg-[#0F0276] hover:bg-[#0F0276]/90 text-white dark:bg-[#B8860B] dark:hover:bg-[#B8860B]/90 dark:text-[#0F0276]"
          disabled={isLoading}
        >
          {isLoading && <img src="/assets/betteh_logo_black_font.png" alt="Loading" className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleNewParent}
          className="w-full"
        >
          I'm a New Parent
        </Button>
      </div>
    </ParentModal>
  );
}