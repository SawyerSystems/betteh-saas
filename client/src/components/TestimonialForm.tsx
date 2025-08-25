import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { memo } from 'react';

interface Testimonial {
  id?: number;
  name: string;
  text: string;
  rating: number;
  featured?: boolean;
}

interface TestimonialFormProps {
  testimonial: Testimonial;
  index: number;
  onSave: (index: number, testimonial: Testimonial) => void | Promise<void>;
  onRemove: (index: number) => void;
  onSetFeatured: (index: number) => Promise<void>;
}

const TestimonialForm = memo(({ testimonial, index, onSave, onRemove, onSetFeatured }: TestimonialFormProps) => {
  const [localTestimonial, setLocalTestimonial] = useState<Testimonial>({
    ...testimonial
  });

  const handleChange = (field: keyof Testimonial, value: any) => {
    setLocalTestimonial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    await onSave(index, localTestimonial);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Parent Name</Label>
          <Input
            value={localTestimonial.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Parent name"
            onBlur={handleSave}
          />
        </div>
        <div>
          <Label>Rating</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={localTestimonial.rating}
            onChange={(e) => handleChange('rating', Number(e.target.value))}
            onBlur={handleSave}
          />
        </div>
      </div>
      <div>
        <Label>Testimonial Text</Label>
        <Textarea
          value={localTestimonial.text}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Parent testimonial..."
          rows={3}
          onBlur={handleSave}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`featured-${index}`}
            checked={localTestimonial.featured || false}
            onChange={async (e) => {
              if (e.target.checked) {
                await onSetFeatured(index);
              }
            }}
            className="rounded border-gray-300 text-pink-600 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
          />
          <Label htmlFor={`featured-${index}`} className="text-sm">
            Featured testimonial {localTestimonial.featured && <span className="text-pink-600 font-semibold">(Currently Featured)</span>}
          </Label>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
        >
          Remove Testimonial
        </Button>
      </div>
    </div>
  );
});

TestimonialForm.displayName = 'TestimonialForm';

export default TestimonialForm;
