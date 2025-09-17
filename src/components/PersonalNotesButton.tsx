import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PersonalNotesDialog from "./PersonalNotesDialog";

const PersonalNotesButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchNotesCount();
    }
  }, [profile]);

  const fetchNotesCount = async () => {
    if (!profile) return;
    
    try {
      const { count, error } = await supabase
        .from('personal_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (error) throw error;
      setNotesCount(count || 0);
    } catch (error) {
      console.error('Error fetching notes count:', error);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800 shadow-lg"
          title={`הערות אישיות (${notesCount} הערות)`}
        >
          <StickyNote className="h-5 w-5" />
        </Button>
        {notesCount > 0 && (
          <div className="fixed bottom-10 left-10 z-50 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {notesCount > 99 ? '99+' : notesCount}
          </div>
        )}
      </div>
      
      <PersonalNotesDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        onNotesChange={fetchNotesCount}
      />
    </>
  );
};

export default PersonalNotesButton;