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
  const [generatedMessages, setGeneratedMessages] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Telegram Posting State
  const [isPosting, setIsPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState<Record<string, 'pending' | 'posting' | 'success' | 'error'>>({});

  // Settings State
  const [openaiKey, setOpenaiKey] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChannelId, setTelegramChannelId] = useState('');
  const [openaiKeyValidation, setOpenaiKeyValidation] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  // Modal State
  const [showDataModal, setShowDataModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  const { toast } = useToast();

  // API Functions
  const fetchSignalData = async (type: string) => {
    type = "/" + type;
    console.log(type);
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: "session_17743635997",
          messages: [type]
        })
      });
      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      setFetchedData(prev => ({ ...prev, [type]: data.responses[0] }));

      // Show modal with fetched data
      setModalData(data.responses[0]);
      setShowDataModal(true);

      // console.log(data.responses[0]);
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
      let message: string = "";
      let fetchedDataString = "";

      // Include all fetched data for selected types
      for (const type of selectedTypes) {
        if (!fetchedData["/" + type]) continue;
        fetchedDataString += `${fetchedData["/" + type]}\n\n`;
      }
      console.log(fetchedDataString);
      const response = await fetch('http://localhost:8000/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: openaiKey,
          prompt: prompt.replace('{{data}}', fetchedDataString),
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Store the generated message for all selected types
        message = result.generated_text;
      }

      setGeneratedMessages(message);
      toast({
        title: "Preview generated",
        description: `Generated message preview`,
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
    if (!telegramBotToken || !telegramChannelId || !generatedMessages) return;

    try {
      setIsPosting(true);
      const progress: Record<string, 'pending' | 'posting' | 'success' | 'error'> = {
        'combined': 'pending'
      };
      setPostingProgress(progress);

      // Post the combined message
      progress['combined'] = 'posting';
      setPostingProgress({ ...progress });

      try {
        const response = await fetch('http://localhost:8000/api/send-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            BOT_TOKEN: telegramBotToken,
            CHANNEL_USERNAME: telegramChannelId,
            messages: [{ type: 'combined', content: generatedMessages }]
          })
        });

        if (response.ok) {
          const result = await response.json();
          progress['combined'] = result.success ? 'success' : 'error';
        } else {
          progress['combined'] = 'error';
        }
      } catch {
        progress['combined'] = 'error';
      }

      setPostingProgress({ ...progress });

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
            Elite Signals Admin Panel
          </h1>
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Fetching Signal Data</h2>
            <p className="text-muted-foreground">Please wait while we retrieve the latest signal information...</p>
          </div>
        </div>
      )}

      {/* Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Fetched Signal Data</h2>
              <button
                onClick={() => setShowDataModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                  {JSON.stringify(modalData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}