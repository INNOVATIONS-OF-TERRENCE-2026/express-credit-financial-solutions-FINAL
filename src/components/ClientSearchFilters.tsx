import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  ssn_last4: string;
  membership_plan: string;
  progress_status: number;
  agreement_signed: boolean;
  created_at: string;
  documents_uploaded: number;
}

interface SearchFilters {
  searchTerm: string;
  membershipLevel: string;
  agreementSigned: string;
  progressRange: string;
  documentsUploaded: string;
}

interface ClientSearchFiltersProps {
  onResultsChange: (clients: Client[]) => void;
}

export function ClientSearchFilters({ onResultsChange }: ClientSearchFiltersProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    membershipLevel: 'all',
    agreementSigned: 'all',
    progressRange: 'all',
    documentsUploaded: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const clientsData = data || [];
      setClients(clientsData);
      setFilteredClients(clientsData);
      onResultsChange(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Search term filter (name, email, phone, SSN last 4)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.full_name?.toLowerCase().includes(term) ||
        client.email_address?.toLowerCase().includes(term) ||
        client.phone_number?.includes(term) ||
        client.ssn_last4?.includes(term)
      );
    }

    // Membership level filter
    if (filters.membershipLevel !== 'all') {
      filtered = filtered.filter(client => 
        client.membership_plan?.toLowerCase() === filters.membershipLevel.toLowerCase()
      );
    }

    // Agreement signed filter
    if (filters.agreementSigned !== 'all') {
      const isSigned = filters.agreementSigned === 'signed';
      filtered = filtered.filter(client => client.agreement_signed === isSigned);
    }

    // Progress range filter
    if (filters.progressRange !== 'all') {
      filtered = filtered.filter(client => {
        const progress = client.progress_status || 0;
        switch (filters.progressRange) {
          case '0-25': return progress <= 25;
          case '26-50': return progress > 25 && progress <= 50;
          case '51-75': return progress > 50 && progress <= 75;
          case '76-100': return progress > 75;
          default: return true;
        }
      });
    }

    // Documents uploaded filter
    if (filters.documentsUploaded !== 'all') {
      filtered = filtered.filter(client => {
        const docs = client.documents_uploaded || 0;
        switch (filters.documentsUploaded) {
          case 'none': return docs === 0;
          case 'partial': return docs > 0 && docs < 3;
          case 'complete': return docs >= 3;
          default: return true;
        }
      });
    }

    setFilteredClients(filtered);
    onResultsChange(filtered);
  };

  const clearFilters = () => {
    const defaultFilters = {
      searchTerm: '',
      membershipLevel: 'all',
      agreementSigned: 'all',
      progressRange: 'all',
      documentsUploaded: 'all'
    };
    setFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '' && value !== 'all').length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Client Search & Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Find clients quickly using search and advanced filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or last 4 SSN..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-9"
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Membership Level Filter */}
          <div className="space-y-2">
            <Label>Membership Level</Label>
            <Select
              value={filters.membershipLevel}
              onValueChange={(value) => setFilters(prev => ({ ...prev, membershipLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agreement Status Filter */}
          <div className="space-y-2">
            <Label>Agreement Status</Label>
            <Select
              value={filters.agreementSigned}
              onValueChange={(value) => setFilters(prev => ({ ...prev, agreementSigned: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="unsigned">Not Signed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress Range Filter */}
          <div className="space-y-2">
            <Label>Progress Range</Label>
            <Select
              value={filters.progressRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, progressRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Progress</SelectItem>
                <SelectItem value="0-25">0-25%</SelectItem>
                <SelectItem value="26-50">26-50%</SelectItem>
                <SelectItem value="51-75">51-75%</SelectItem>
                <SelectItem value="76-100">76-100%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Uploaded Filter */}
          <div className="space-y-2">
            <Label>Documents Status</Label>
            <Select
              value={filters.documentsUploaded}
              onValueChange={(value) => setFilters(prev => ({ ...prev, documentsUploaded: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="none">No Documents</SelectItem>
                <SelectItem value="partial">Partial Upload</SelectItem>
                <SelectItem value="complete">Complete (3+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredClients.length} of {clients.length} clients
            </span>
          </div>
          
          {getActiveFilterCount() > 0 && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          
          <Button onClick={fetchClients} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}