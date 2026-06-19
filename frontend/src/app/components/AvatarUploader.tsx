import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { AlertCircle, Upload } from 'lucide-react';

interface AvatarUploaderProps {
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  currentAvatarUrl?: string;
}

/**
 * Avatar uploader component with client-side and server-side validation
 * Accepts JPEG, PNG, GIF, WebP images (max 5MB)
 */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  currentAvatarUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  // Validation constants
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  /**
   * Validate file on client side before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File is too large (${sizeMb}MB). Maximum size is 5MB.`;
    }

    // Check file type by MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file extension '.${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Upload avatar to backend
   */
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('muallim_access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch('http://localhost:8000/api/profile/avatar/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle server validation errors
        const errorMsg = data.errors?.profile_picture?.[0] || 'Upload failed';
        throw new Error(errorMsg);
      }

      setSuccess('Avatar uploaded successfully!');
      if (data.profile_picture_url) {
        onUploadSuccess?.(data.profile_picture_url);
      }

      // Reset file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Trigger file input click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Avatar file input"
      />

      {/* Preview */}
      {preview && (
        <div className="flex justify-center">
          <img
            src={preview}
            alt="Avatar preview"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF, WebP • Max size: 5MB
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleBrowseClick}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose Image
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!preview || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Uploading...' : 'Upload Avatar'}
        </Button>
      </div>
    </div>
  );
};
