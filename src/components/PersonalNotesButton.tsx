import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";
import PersonalNotesDialog from "./PersonalNotesDialog";

const PersonalNotesButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800 shadow-lg"
        title="הערות אישיות"
      >
        <StickyNote className="h-4 w-4" />
      </Button>
      
      <PersonalNotesDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
      />
    </>
  );
};

export default PersonalNotesButton;