import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  features?: string[];
  variant?: "primary" | "secondary";
}

export function CTASection({
  title = "Ready to Start Their Adventure?",
  subtitle = "Join Coach Will's gymnastics program where every child discovers their potential through fun, safe, and personalized training.",
  primaryButtonText = "Start Their Journey",
  primaryButtonLink = "/booking",
  secondaryButtonText = "Ask Questions",
  secondaryButtonLink = "/contact",
  features = [
    "Personalized training plans",
    "Safe & supportive environment",
    "Flexible scheduling",
    "Progress tracking"
  ],
  variant = "primary"
}: CTASectionProps) {
  const bgClass = variant === "primary" 
    ? "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" 
    : "bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50";

  return (
    <section className={`py-16 lg:py-24 ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-12 w-12 text-yellow-500 animate-pulse" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
            {title}
          </h2>
          
          <p className="text-xl text-gray-600 mb-8">
            {subtitle}
          </p>

          {features && features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={primaryButtonLink}>
              <Button 
                size="lg" 
                className="coach-will-gradient text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
              >
                {primaryButtonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href={secondaryButtonLink}>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
              >
                {secondaryButtonText}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}