import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenders } from "@/hooks/useGenders";

interface GenderSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
}

export function GenderSelect({ 
  value, 
  defaultValue, 
  onValueChange, 
  name = "gender",
  required = false,
  disabled = false,
  id = "gender-select",
  "aria-label": ariaLabel = "Select gender",
  "aria-describedby": ariaDescribedBy,
  className,
  ...props 
}: GenderSelectProps) {
  const { genders, loading, error } = useGenders();

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        Gender
      </Label>
      <Select 
        value={value}
        defaultValue={defaultValue || ""} 
        onValueChange={onValueChange}
        name={name}
        disabled={disabled || loading}
        required={required}
        {...props}
      >
        <SelectTrigger 
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={`w-full ${className || ''}`}
        >
          <SelectValue placeholder={loading ? "Loading genders..." : "Select gender..."} />
        </SelectTrigger>
        <SelectContent>
          {genders.map((gender) => (
            <SelectItem 
              key={gender.id} 
              value={gender.name}
              aria-label={`Select ${gender.display_name}`}
            >
              {gender.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-red-500" id={`${id}-error`}>
          {error}
        </p>
      )}
      {!required && !error && (
        <p className="text-xs text-gray-500" id={`${id}-help`}>
          Optional - used for appropriate coaching approaches
        </p>
      )}
    </div>
  );
}
