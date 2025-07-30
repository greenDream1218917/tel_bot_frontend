import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PreviewSectionProps {
  selectedTypes: string[];
  prompt: string;
  fetchedData: Record<string, any>;
  onGeneratePreview: () => void;
  generatedMessages: Record<string, string>;
  isGenerating: boolean;
  openaiKey: string;
}

export function PreviewSection({
  selectedTypes,
  prompt,
  fetchedData,
  onGeneratePreview,
  generatedMessages,
  isGenerating,
  openaiKey
}: PreviewSectionProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const canGenerate = selectedTypes.length > 0 && prompt.includes('{{data}}') && openaiKey;

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedItems(prev => new Set([...prev, type]));
      toast({
        title: "Copied!",
        description: `${type} message copied to clipboard`,
      });
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(type);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Eye className="w-5 h-5 text-primary" />
          Message Preview
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Generate and preview messages before posting to Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {selectedTypes.length} types selected
            </Badge>
            {prompt.includes('{{data}}') && (
              <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                Prompt ready
              </Badge>
            )}
            {openaiKey && (
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                API key set
              </Badge>
            )}
          </div>

          <Button
            onClick={onGeneratePreview}
            disabled={!canGenerate || isGenerating}
            className="bg-gradient-primary text-primary-foreground shadow-primary hover:shadow-glow transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Generate Preview
              </>
            )}
          </Button>
        </div>

        {!canGenerate && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg animate-fade-in">
            <p className="text-sm text-warning-foreground">
              To generate previews, ensure you have:
            </p>
            <ul className="text-xs text-warning-foreground/80 mt-1 space-y-1">
              {selectedTypes.length === 0 && <li>• Select at least one signal type</li>}
              {!prompt.includes('{{data}}') && <li>• Add data placeholder to your prompt</li>}
              {!openaiKey && <li>• Set your OpenAI API key in settings</li>}
            </ul>
          </div>
        )}

        {Object.keys(generatedMessages).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Generated Messages:</h4>
            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-4">
                {Object.entries(generatedMessages).map(([type, message], index) => (
                  <div
                    key={type}
                    className="p-4 bg-secondary/30 border border-border rounded-lg animate-bounce-in relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message, type)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedItems.has(type) ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {message}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}