import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIMEZONE_OPTIONS } from '@/utils/preferences';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

/**
 * Timezone Selector Component
 * Allows users to select their preferred timezone for session display
 */
export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="timezone" className="text-sm font-medium">
        Timezone
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Select your timezone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONE_OPTIONS.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        Your session times will be displayed in the selected timezone
      </p>
    </div>
  );
};

export default TimezoneSelector;
