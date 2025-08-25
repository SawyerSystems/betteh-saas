import { memo, useMemo, useCallback, useState, useEffect } from "react";
import { usePerformanceMonitor, debounce, throttle } from "@/utils/performance";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

// Optimized modal wrapper for better performance
export const OptimizedModal = memo(function OptimizedModal({
  isOpen,
  onClose,
  children,
  title = "Modal",
  className = "",
  size = "default"
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
}) {
  const { startMeasure } = usePerformanceMonitor('OptimizedModal');

  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl"
  };

  const handleClose = useCallback(() => {
    const measure = startMeasure();
    onClose();
    measure();
  }, [onClose, startMeasure]);

  const modalContent = useMemo(() => {
    if (!isOpen) return null;

    return (
      <DialogContent className={`${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden ${className}`}>
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    );
  }, [isOpen, children, title, className, size, handleClose, sizeClasses]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {modalContent}
    </Dialog>
  );
});

// Optimized search component with debouncing
export const OptimizedSearch = memo(function OptimizedSearch({
  onSearch,
  placeholder = "Search...",
  delay = 300,
  className = ""
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  
  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(onSearch, delay),
    [onSearch, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        className="pl-10"
      />
    </div>
  );
});

// Virtual scrolling component for large lists
function VirtualScrollList<T>({
  items,
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  className = ""
}: {
  items: T[];
  itemHeight?: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // ~60fps
    []
  );

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export the VirtualScrollList component
export { VirtualScrollList };

// Optimized card grid with lazy loading
export const OptimizedCardGrid = memo(function OptimizedCardGrid({
  children,
  columns = 3,
  gap = 4,
  className = ""
}: {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  const gapClasses = {
    2: "gap-2",
    3: "gap-3", 
    4: "gap-4",
    6: "gap-6",
    8: "gap-8"
  };

  return (
    <div className={`grid ${gridClasses[columns as keyof typeof gridClasses]} ${gapClasses[gap as keyof typeof gapClasses]} ${className}`}>
      {children}
    </div>
  );
});

// Optimized image gallery with lazy loading
export const OptimizedImageGallery = memo(function OptimizedImageGallery({
  images,
  columns = 3,
  className = ""
}: {
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns?: number;
  className?: string;
}) {
  return (
    <OptimizedCardGrid columns={columns} className={className}>
      {images.map((image, index) => (
        <div key={index} className="space-y-2">
          <LazyImage
            src={image.src}
            alt={image.alt}
            className="w-full h-48 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          />
          {image.caption && (
            <p className="text-sm text-gray-600 text-center">{image.caption}</p>
          )}
        </div>
      ))}
    </OptimizedCardGrid>
  );
});

// Optimized loading skeleton
export const OptimizedSkeleton = memo(function OptimizedSkeleton({
  className = "",
  count = 1,
  height = "h-4"
}: {
  className?: string;
  count?: number;
  height?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`bg-gray-200 rounded animate-pulse ${height}`} />
      ))}
    </div>
  );
});

// Optimized data table with virtual scrolling
export const OptimizedDataTable = memo(function OptimizedDataTable<T>({
  data,
  columns,
  className = "",
  maxHeight = 400
}: {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  className?: string;
  maxHeight?: number;
}) {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        
        <VirtualScrollList
          items={data}
          itemHeight={60}
          containerHeight={maxHeight}
          renderItem={(item: T, index: number) => (
            <table className="w-full">
              <tbody>
                <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3 text-sm text-gray-900">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key])
                      }
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        />
      </div>
    </div>
  );
});