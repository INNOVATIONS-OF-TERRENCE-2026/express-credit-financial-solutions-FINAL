import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StickyNote, Plus, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AdminNote {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  admin_user_id: string;
  admin_email?: string;
}

interface AdminNotesPanelProps {
  clientId: string;
  clientName?: string;
}

export function AdminNotesPanel({ clientId, clientName }: AdminNotesPanelProps) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [clientId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select(`
          *,
          admin_email:profiles!admin_notes_admin_user_id_fkey(email)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include admin email
      const notesWithEmail = (data || []).map(note => ({
        ...note,
        admin_email: 'Admin User'
      }));

      setNotes(notesWithEmail);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load admin notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .insert({
          client_id: clientId,
          admin_user_id: user.id,
          note_text: newNote.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to the list with admin email
      const noteWithEmail = {
        ...data,
        admin_email: user.email || 'Current Admin'
      };

      setNotes(prev => [noteWithEmail, ...prev]);
      setNewNote('');

      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
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
          <StickyNote className="h-5 w-5" />
          Internal Notes (Admin Only)
          {notes.length > 0 && (
            <Badge variant="secondary">{notes.length} notes</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Private admin notes for {clientName || 'this client'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a note about this client (e.g., 'Client said they will send SSN tomorrow')"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button 
            onClick={addNote} 
            disabled={!newNote.trim() || submitting}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {submitting ? 'Adding Note...' : 'Add Note'}
          </Button>
        </div>

        <Separator />

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add the first note about this client</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={note.id} className="border rounded-lg p-4 space-y-2">
                  {/* Note Header */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{note.admin_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span title={formatDate(note.created_at)}>
                        {getTimeAgo(note.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="text-sm leading-relaxed">
                    {note.note_text}
                  </div>

                  {/* Note Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Entry #{notes.length - index}</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}