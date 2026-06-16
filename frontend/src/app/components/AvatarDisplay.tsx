import React from 'react';

interface AvatarDisplayProps {
  /** Image URL or undefined */
  src?: string;
  /** User's name for fallback initials */
  name?: string;
  /** alt text for image */
  alt?: string;
  /** Size of avatar: sm (32px), md (40px), lg (64px), xl (96px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Avatar display component with fallback to user initials
 * Shows profile picture if available, otherwise shows initials in a colored circle
 */
export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  src,
  name = 'User',
  alt = 'User avatar',
  size = 'md',
  className = '',
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  // Generate initials from name
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  // Generate consistent color based on name
  const getColorFromName = (fullName: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-red-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
    ];

    const hash = fullName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  // If image available, show it
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200 ${className}`}
      />
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
