import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Wand2, RotateCcw } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  "Write a short Telegram signal using this crypto data: {{data}}. Make it urgent and concise with emojis.",
  "Analyze this crypto signal data: {{data}}. Provide a brief technical analysis with buy/sell recommendation.",
  "Create a professional crypto alert from: {{data}}. Include key metrics and trading advice.",
];

export function PromptEditor({ prompt, onPromptChange }: PromptEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  const insertTemplate = (template: string) => {
    onPromptChange(template);
  };

  const clearPrompt = () => {
    onPromptChange('');
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageSquare className="w-5 h-5 text-primary" />
          ChatGPT Prompt Editor
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Create your custom prompt template. Use {'{{'} data {'}}'}  to insert fetched signal data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Quick Templates:</h4>
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPrompt}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => insertTemplate(template)}
                className="text-xs hover:border-primary/50 hover:bg-secondary/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Template {index + 1}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative">
          {prompt.includes('{{data}}') && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-success/20 text-success border-success/30 animate-bounce-in"
            >
              👍
            </Badge>
          )}
          <Textarea
            placeholder="Enter your custom ChatGPT prompt here... Use {{data}} to insert the fetched signal data."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              min-h-32 resize-y transition-all duration-300 
              bg-input/50 border-border text-foreground placeholder:text-muted-foreground
              focus:border-primary focus:ring-primary/20 focus:shadow-primary/20
              ${isFocused ? 'shadow-glow' : ''}
            `}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <span>Use {'{{'} data {'}}'}  placeholder to insert fetched signal data</span>
        </div>

        {prompt && (
          <div className="animate-slide-up">
            <h4 className="text-sm font-medium text-foreground mb-2">Preview:</h4>
            <div className="p-3 bg-secondary/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prompt.split('{{data}}').map((part, index) => (
                  <span key={index}>
                    {part}
                    {index < prompt.split('{{data}}').length - 1 && (
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono">
                        [SIGNAL DATA]
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}