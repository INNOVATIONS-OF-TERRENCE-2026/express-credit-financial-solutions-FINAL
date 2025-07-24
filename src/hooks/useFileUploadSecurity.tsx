import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadConfig {
  max_file_size_mb: number;
  allowed_file_types: string[];
}

export function useFileUploadSecurity() {
  const [config, setConfig] = useState<FileUploadConfig>({
    max_file_size_mb: 10,
    allowed_file_types: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('file_upload_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching upload config:', error);
        return;
      }

      if (data) {
        setConfig({
          max_file_size_mb: data.max_file_size_mb,
          allowed_file_types: data.allowed_file_types
        });
      }
    } catch (error) {
      console.error('Error fetching upload config:', error);
    }
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file size
    const maxSizeBytes = config.max_file_size_mb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${config.max_file_size_mb}MB limit`
      };
    }

    // Check file type by extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowed_file_types.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type .${fileExtension} is not allowed. Allowed types: ${config.allowed_file_types.join(', ')}`
      };
    }

    // Basic MIME type validation
    const allowedMimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg', 
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const expectedMimeType = allowedMimeTypes[fileExtension as keyof typeof allowedMimeTypes];
    if (expectedMimeType && file.type !== expectedMimeType) {
      return {
        isValid: false,
        error: 'File content does not match file extension'
      };
    }

    return { isValid: true };
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove special characters and replace with underscores
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  };

  return {
    config,
    validateFile,
    sanitizeFileName
  };
}