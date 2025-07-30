import { useState } from 'react';
import { SignalSelector } from './SignalSelector';
import { PromptEditor } from './PromptEditor';
import { PreviewSection } from './PreviewSection';
import { TelegramPoster } from './TelegramPoster';
import { SettingsModal } from './SettingsModal';
import { useToast } from '@/hooks/use-toast';

export function AdminPanel() {
  // Signal Selection State
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [fetchedData, setFetchedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Prompt State
  const [prompt, setPrompt] = useState('');

  // Preview State
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Telegram Posting State
  const [isPosting, setIsPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState<Record<string, 'pending' | 'posting' | 'success' | 'error'>>({});

  // Settings State
  const [openaiKey, setOpenaiKey] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChannelId, setTelegramChannelId] = useState('');
  const [openaiKeyValidation, setOpenaiKeyValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const { toast } = useToast();

  // API Functions
  const fetchSignalData = async (type: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/api/fetch-data?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      setFetchedData(prev => ({ ...prev, [type]: data }));

      toast({
        title: "Data fetched",
        description: `Successfully fetched ${type} signal data`,
      });
    } catch (error) {
      toast({
        title: "Fetch failed",
        description: `Failed to fetch ${type} data`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!openaiKey || !prompt.includes('{{data}}')) return;

    try {
      setIsGenerating(true);
      const messages: Record<string, string> = {};

      for (const type of selectedTypes) {
        if (!fetchedData[type]) continue;

        const response = await fetch('http://localhost:8000/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: openaiKey,
            prompt: prompt.replace('{{data}}', JSON.stringify(fetchedData[type])),
            data: fetchedData[type]
          })
        });

        if (response.ok) {
          const result = await response.json();
          messages[type] = result.content;
        }
      }

      setGeneratedMessages(messages);
      toast({
        title: "Preview generated",
        description: `Generated ${Object.keys(messages).length} messages`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate message previews",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const postToTelegram = async () => {
    if (!telegramBotToken || !telegramChannelId) return;

    try {
      setIsPosting(true);
      const progress: Record<string, 'pending' | 'posting' | 'success' | 'error'> = {};

      // Initialize progress
      Object.keys(generatedMessages).forEach(type => {
        progress[type] = 'pending';
      });
      setPostingProgress(progress);

      // Post each message
      for (const [type, content] of Object.entries(generatedMessages)) {
        progress[type] = 'posting';
        setPostingProgress({ ...progress });

        try {
          const response = await fetch('http://localhost:8000/api/send-signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ type, content }]
            })
          });

          progress[type] = response.ok ? 'success' : 'error';
        } catch {
          progress[type] = 'error';
        }

        setPostingProgress({ ...progress });
        // Add delay between posts
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const successCount = Object.values(progress).filter(status => status === 'success').length;
      toast({
        title: "Posting complete",
        description: `Successfully posted ${successCount}/${Object.keys(progress).length} messages`,
      });
    } catch (error) {
      toast({
        title: "Posting failed",
        description: "Failed to post messages to Telegram",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const validateOpenaiKey = async (key: string) => {
    if (!key) return;

    try {
      setOpenaiKeyValidation('validating');
      const response = await fetch('http://localhost:8000/api/check-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });

      setOpenaiKeyValidation(response.ok ? 'valid' : 'invalid');
    } catch {
      setOpenaiKeyValidation('invalid');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Settings Button */}
      <SettingsModal
        openaiKey={openaiKey}
        telegramBotToken={telegramBotToken}
        telegramChannelId={telegramChannelId}
        onOpenaiKeyChange={setOpenaiKey}
        onTelegramBotTokenChange={setTelegramBotToken}
        onTelegramChannelIdChange={setTelegramChannelId}
        onValidateOpenaiKey={validateOpenaiKey}
        openaiKeyValidation={openaiKeyValidation}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Signals Admin Panel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select signals, craft prompts, generate messages, and post to Telegram with ease
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <SignalSelector
              selectedTypes={selectedTypes}
              onSelectionChange={setSelectedTypes}
              fetchedData={fetchedData}
              onFetchData={fetchSignalData}
              isLoading={isLoading}
            />

            <PromptEditor
              prompt={prompt}
              onPromptChange={setPrompt}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <PreviewSection
              selectedTypes={selectedTypes}
              prompt={prompt}
              fetchedData={fetchedData}
              onGeneratePreview={generatePreview}
              generatedMessages={generatedMessages}
              isGenerating={isGenerating}
              openaiKey={openaiKey}
            />

            <TelegramPoster
              selectedTypes={selectedTypes}
              generatedMessages={generatedMessages}
              onPostToTelegram={postToTelegram}
              isPosting={isPosting}
              postingProgress={postingProgress}
              telegramConfig={{
                botToken: telegramBotToken,
                channelId: telegramChannelId
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}