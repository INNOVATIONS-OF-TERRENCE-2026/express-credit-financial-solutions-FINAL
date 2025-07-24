// Input validation and sanitization utilities

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .substring(0, 1000); // Limit input length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateSSN = (ssn: string): boolean => {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
};

export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name);
};

export const validateAccountNumber = (accountNumber: string): boolean => {
  const accountRegex = /^[a-zA-Z0-9-]{1,20}$/;
  return accountRegex.test(accountNumber);
};

export const sanitizeAccountNumber = (accountNumber: string): string => {
  return accountNumber.replace(/[^a-zA-Z0-9-]/g, '');
};

export const sanitizeSSN = (ssn: string): string => {
  return ssn.replace(/[^\d-]/g, '');
};

export const sanitizeDisputeContent = (content: string): string => {
  if (typeof content !== 'string') return '';
  
  return content
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .substring(0, 5000); // Limit length
};

export const validateDisputeFormData = (data: {
  creditorName: string;
  accountNumber: string;
  issueType: string;
  additionalNotes?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.creditorName || data.creditorName.length < 2) {
    errors.push('Creditor name must be at least 2 characters long');
  }

  if (!data.accountNumber || !validateAccountNumber(data.accountNumber)) {
    errors.push('Account number must be alphanumeric and up to 20 characters');
  }

  if (!data.issueType) {
    errors.push('Issue type is required');
  }

  if (data.additionalNotes && data.additionalNotes.length > 1000) {
    errors.push('Additional notes must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};