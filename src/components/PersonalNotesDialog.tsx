import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface PersonalNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PersonalNotesDialog = ({ open, onOpenChange }: PersonalNotesDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editNote, setEditNote] = useState({ title: "", content: "" });

  useEffect(() => {
    if (open && profile) {
      fetchNotes();
    }
  }, [open, profile]);

  const fetchNotes = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('user_id', profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון הערות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!profile || !newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .insert({
          user_id: profile.id,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote({ title: "", content: "" });
      toast({
        title: "הצלחה",
        description: "הערה נוספה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף הערה",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editNote.title.trim() || !editNote.content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .update({
          title: editNote.title.trim(),
          content: editNote.content.trim(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(notes.map(note => note.id === id ? data : note));
      setEditingId(null);
      toast({
        title: "הצלחה",
        description: "הערה עודכנה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן הערה",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "הצלחה",
        description: "הערה נמחקה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק הערה",
        variant: "destructive",
      });
    }
  };

  const startEditing = (note: PersonalNote) => {
    setEditingId(note.id);
    setEditNote({ title: note.title, content: note.content });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNote({ title: "", content: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>הערות אישיות</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Add new note */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הוסף הערה חדשה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="כותרת ההערה..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <Textarea
                placeholder="תוכן ההערה..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={3}
              />
              <Button
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                הוסף הערה
              </Button>
            </CardContent>
          </Card>

          {/* Existing notes */}
          {loading ? (
            <div className="text-center py-8">טוען הערות...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין הערות. הוסף הערה ראשונה!
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="bg-white border-yellow-200">
                  <CardContent className="p-4">
                    {editingId === note.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editNote.title}
                          onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                        />
                        <Textarea
                          value={editNote.content}
                          onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateNote(note.id)}
                            size="sm"
                            disabled={!editNote.title.trim() || !editNote.content.trim()}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            שמור
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{note.title}</h4>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => startEditing(note)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteNote(note.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          נוצר: {new Date(note.created_at).toLocaleDateString('he-IL')}
                          {note.updated_at !== note.created_at && (
                            <span> • עודכן: {new Date(note.updated_at).toLocaleDateString('he-IL')}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalNotesDialog;
