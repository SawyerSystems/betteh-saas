import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown, Image, Video, Type } from "lucide-react";

export interface ContentSection {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string;
}

interface SectionBasedContentEditorProps {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
}

export function SectionBasedContentEditor({ sections, onChange }: SectionBasedContentEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const addSection = (type: ContentSection['type']) => {
    const newSection: ContentSection = {
      id: `section-${Date.now()}`,
      type,
      content: ''
    };
    onChange([...sections, newSection]);
    setExpandedSections(new Set(Array.from(expandedSections).concat(newSection.id)));
  };

  const removeSection = (id: string) => {
    onChange(sections.filter(section => section.id !== id));
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(id);
    setExpandedSections(newExpanded);
  };

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    onChange(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < sections.length) {
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
      onChange(newSections);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionIcon = (type: ContentSection['type']) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('image')}
        >
          <Image className="h-4 w-4 mr-2" />
          Add Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSection('video')}
        >
          <Video className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {sections.map((section, index) => (
        <Card key={section.id} className="overflow-hidden dark:bg-slate-800/50 dark:border-slate-600">
          <CardHeader className="py-3 px-4 bg-gray-50 dark:bg-slate-700/50 border-b dark:border-slate-600">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium hover:text-primary dark:text-slate-200 dark:hover:text-[#D8BD2A]"
                onClick={() => toggleExpanded(section.id)}
              >
                {getSectionIcon(section.type)}
                <span className="capitalize">{section.type} Section</span>
                {!expandedSections.has(section.id) && section.content && (
                  <span className="text-gray-500 dark:text-slate-400 font-normal text-xs ml-2">
                    ({section.content.substring(0, 50)}...)
                  </span>
                )}
              </button>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {expandedSections.has(section.id) && (
            <CardContent className="p-4">
              {section.type === 'text' && (
                <div>
                  <Label htmlFor={`content-${section.id}`} className="text-slate-700 dark:text-slate-300">Content</Label>
                  <Textarea
                    id={`content-${section.id}`}
                    value={section.content}
                    onChange={(e) => updateSection(section.id, { content: e.target.value })}
                    rows={5}
                    className="font-mono mt-1"
                    placeholder="Enter your text content here..."
                  />
                </div>
              )}
              
              {section.type === 'image' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`image-url-${section.id}`} className="text-slate-700 dark:text-slate-300">Image URL</Label>
                    <Input
                      id={`image-url-${section.id}`}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`image-caption-${section.id}`} className="text-slate-700 dark:text-slate-300">Caption (optional)</Label>
                    <Input
                      id={`image-caption-${section.id}`}
                      value={section.caption || ''}
                      onChange={(e) => updateSection(section.id, { caption: e.target.value })}
                      placeholder="Image caption..."
                      className="mt-1"
                    />
                  </div>
                  {section.content && (
                    <div className="mt-2">
                      <img 
                        src={section.content} 
                        alt={section.caption || 'Content image'} 
                        className="max-w-full h-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280"%3EImage Error%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {section.type === 'video' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`video-url-${section.id}`} className="text-slate-700 dark:text-slate-300">Video URL</Label>
                    <Input
                      id={`video-url-${section.id}`}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      placeholder="YouTube or Vimeo URL"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`video-caption-${section.id}`} className="text-slate-700 dark:text-slate-300">Caption (optional)</Label>
                    <Input
                      id={`video-caption-${section.id}`}
                      value={section.caption || ''}
                      onChange={(e) => updateSection(section.id, { caption: e.target.value })}
                      placeholder="Video caption..."
                      className="mt-1"
                    />
                  </div>
                  {section.content && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                      Video preview: {section.content}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
          <p>No content sections yet. Add your first section above!</p>
        </div>
      )}
    </div>
  );
}