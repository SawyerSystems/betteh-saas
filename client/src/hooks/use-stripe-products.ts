import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  default_price: {
    id: string;
    unit_amount: number;
    currency: string;
  };
}

interface StripeProductsResponse {
  data: StripeProduct[];
}

export function useStripeProducts() {
  return useQuery({
    queryKey: ["/api/stripe/products"],
    queryFn: async (): Promise<StripeProductsResponse> => {
      const response = await apiRequest("GET", "/api/stripe/products");
      return response.json();
    },
  });
}

export function useStripePricing() {
  const { data: products } = useStripeProducts();
  
  const getLessonPrice = (lessonType: string): number => {
    if (!products?.data) return 0.50; // Fallback to Stripe minimum
    
    // Map lesson types to product names
    const productNameMap: Record<string, string> = {
      "quick-journey": "30-Min Private",
      "dual-quest": "30-Min Semi-Private", 
      "deep-dive": "1-Hour Private",
      "partner-progression": "1-Hour Semi-Private"
    };
    
    const productName = productNameMap[lessonType];
    if (!productName) return 0.50;
    
    const product = products.data.find(p => p.name.includes(productName));
    if (!product?.default_price?.unit_amount) return 0.50;
    
    return product.default_price.unit_amount / 100; // Convert from cents to dollars
  };
  
  return { getLessonPrice, products: products?.data || [] };
}