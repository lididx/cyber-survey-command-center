import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';

interface FindingTemplate {
  id: string;
  subject: string;
}

interface SortableTemplateButtonProps {
  template: FindingTemplate;
}

export function SortableTemplateButton({ template }: SortableTemplateButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative"
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-right justify-start text-sm h-auto py-2 px-2 cursor-grab active:cursor-grabbing"
        title={template.subject}
        disabled={isDragging}
      >
        <span className="break-words text-wrap">• {template.subject}</span>
      </Button>
    </div>
  );
}