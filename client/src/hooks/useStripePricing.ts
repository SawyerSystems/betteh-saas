import { useQuery } from "@tanstack/react-query";

interface StripeProduct {
  id: string;
  name: string;
  default_price: {
    unit_amount: number;
  };
}

interface StripeResponse {
  data: StripeProduct[];
}

export function useStripePricing() {
  const { data: stripeProducts, isLoading, error } = useQuery<StripeResponse>({
    queryKey: ['/api/stripe/products'],
    retry: 2,
  });

  // Map lesson types to Stripe product names
  const lessonTypeToProductName: Record<string, string> = {
    'quick-journey': '30-Min Private [$40]',
    'dual-quest': '30-Min Semi-Private [$50]',
    'deep-dive': '1-Hour Private [$60]',
    'partner-progression': '1-Hour Semi-Private [$80]'
  };

  const getReservationFee = (lessonType: string): number => {
    if (!stripeProducts?.data) return 0.00; // Fallback to $0
    
    const productName = lessonTypeToProductName[lessonType];
    if (!productName) return 0.00; // Fallback to $0
    
    const matchingProduct = stripeProducts.data.find(product => product.name === productName);
    if (!matchingProduct?.default_price) return 0.00; // Fallback to $0
    
    return matchingProduct.default_price.unit_amount / 100; // Convert cents to dollars
  };

  const getAllReservationFees = (): Record<string, number> => {
    const fees: Record<string, number> = {};
    
    Object.keys(lessonTypeToProductName).forEach(lessonType => {
      fees[lessonType] = getReservationFee(lessonType);
    });
    
    return fees;
  };

  return {
    stripeProducts: stripeProducts?.data || [],
    isLoading,
    error,
    getReservationFee,
    getAllReservationFees,
  };
}