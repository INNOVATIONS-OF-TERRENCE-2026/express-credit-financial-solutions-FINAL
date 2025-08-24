export type Owner = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  percent_ownership?: number;
  ssn_last4?: string;
};

export type Business = {
  legal_name: string;
  dba_name?: string;
  ein?: string;
  naics?: string;
  years_in_business?: number;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
};

export type Borrower = {
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  user_id?: string;
};

export type ApplicationCreate = {
  borrower: Borrower;
  business: Business;
  program: "7a" | "504" | "microloan" | "express";
  requested_amount: number;
  use_of_funds?: string;
  owners: Owner[];
  extra_data?: Record<string, any>;
};

export type ApplicationStatus = 
  | "precheck" 
  | "consent" 
  | "intake" 
  | "docs" 
  | "packaged" 
  | "sent_to_lender";

export type UploadedDoc = {
  doc_type: string;
  filename: string;
  url?: string;
};

export type AppState = {
  applicationId?: string;
  borrowerId?: string;
  businessId?: string;
  matchedProgram?: "7a" | "504" | "microloan" | "express";
  status: ApplicationStatus;
  uploadedDocs: UploadedDoc[];
  consentsCompleted: boolean;
};

export type SBAConfig = {
  apiBaseUrl: string;
};