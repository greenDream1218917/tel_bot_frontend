import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Send, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TelegramPosterProps {
  selectedTypes: string[];
  generatedMessages: Record<string, string>;
  onPostToTelegram: () => void;
  isPosting: boolean;
  postingProgress: Record<string, 'pending' | 'posting' | 'success' | 'error'>;
  telegramConfig: {
    botToken: string;
    channelId: string;
  };
}

export function TelegramPoster({
  selectedTypes,
  generatedMessages,
  onPostToTelegram,
  isPosting,
  postingProgress,
  telegramConfig
}: TelegramPosterProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  const canPost = selectedTypes.length > 0 && 
                  Object.keys(generatedMessages).length > 0 && 
                  telegramConfig.botToken && 
                  telegramConfig.channelId;

  const completedCount = Object.values(postingProgress).filter(status => status === 'success').length;
  const errorCount = Object.values(postingProgress).filter(status => status === 'error').length;
  const totalCount = Object.keys(postingProgress).length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handlePost = () => {
    onPostToTelegram();
    if (completedCount === totalCount && totalCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'posting':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 animate-pulse" />
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Send className="w-5 h-5 text-primary" />
          Telegram Posting
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Post generated messages to your Telegram channel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {Object.keys(generatedMessages).length} messages ready
            </Badge>
            {telegramConfig.botToken && telegramConfig.channelId && (
              <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                Telegram configured
              </Badge>
            )}
          </div>
          
          <Button
            onClick={handlePost}
            disabled={!canPost || isPosting}
            className={`
              transition-all duration-500 relative overflow-hidden
              ${completedCount === totalCount && totalCount > 0
                ? 'bg-gradient-success text-success-foreground shadow-glow'
                : 'bg-gradient-primary text-primary-foreground shadow-primary hover:shadow-glow'
              }
            `}
          >
            {isPosting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : completedCount === totalCount && totalCount > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                All Posted! 🎉
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Post to Telegram
              </>
            )}
          </Button>
        </div>

        {!canPost && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg animate-fade-in">
            <p className="text-sm text-warning-foreground">
              To post to Telegram, ensure you have:
            </p>
            <ul className="text-xs text-warning-foreground/80 mt-1 space-y-1">
              {selectedTypes.length === 0 && <li>• Select signal types</li>}
              {Object.keys(generatedMessages).length === 0 && <li>• Generate message previews</li>}
              {!telegramConfig.botToken && <li>• Set Telegram bot token in settings</li>}
              {!telegramConfig.channelId && <li>• Set Telegram channel ID in settings</li>}
            </ul>
          </div>
        )}

        {totalCount > 0 && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">Progress</span>
              <span className="text-muted-foreground">
                {completedCount}/{totalCount} posted
                {errorCount > 0 && ` (${errorCount} failed)`}
              </span>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-secondary/30"
            />
            
            <div className="space-y-2">
              {Object.entries(postingProgress).map(([type, status], index) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 bg-secondary/20 rounded border border-border animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <Badge variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  </div>
                  
                  <span className="text-xs text-muted-foreground capitalize">
                    {status === 'success' ? 'Posted ✓' : 
                     status === 'error' ? 'Failed ✗' :
                     status === 'posting' ? 'Posting...' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}