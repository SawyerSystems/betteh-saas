import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <SEOHead
        title="Page Not Found — Coach Will Tumbles"
        description="The page you're looking for doesn't exist."
        canonicalUrl={typeof window !== 'undefined' ? window.location.href : '/404'}
        robots="noindex,follow"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": typeof window !== 'undefined' ? window.location.origin : '/' }
          ]
        }}
      />
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


