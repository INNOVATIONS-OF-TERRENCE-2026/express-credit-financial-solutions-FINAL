import { supabase } from '@/integrations/supabase/client';

// Client-side SSN encryption utilities - UPDATED FOR SECURITY
export const encryptSSN = async (ssn: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('encrypt_ssn_secure', { ssn_text: ssn });
    
    if (error) {
      console.error('Error encrypting SSN:', error);
      throw new Error('Failed to encrypt SSN');
    }
    
    return data;
  } catch (error) {
    console.error('Error in encryptSSN:', error);
    throw error;
  }
};

export const decryptSSN = async (encryptedSSN: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('decrypt_ssn_secure', { encrypted_ssn: encryptedSSN });
    
    if (error) {
      console.error('Error decrypting SSN:', error);
      throw new Error('Failed to decrypt SSN');
    }
    
    return data;
  } catch (error) {
    console.error('Error in decryptSSN:', error);
    throw error;
  }
};

// Format SSN for display (masked)
export const formatSSNForDisplay = (ssn: string): string => {
  if (!ssn || ssn.length < 4) return '***-**-****';
  
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return '***-**-****';
  
  return `***-**-${cleaned.slice(-4)}`;
};