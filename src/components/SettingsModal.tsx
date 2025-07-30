import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, CheckCircle, XCircle, Loader2, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  openaiKey: string;
  telegramBotToken: string;
  telegramChannelId: string;
  onOpenaiKeyChange: (key: string) => void;
  onTelegramBotTokenChange: (token: string) => void;
  onTelegramChannelIdChange: (id: string) => void;
  onValidateOpenaiKey: (key: string) => void;
  openaiKeyValidation: 'idle' | 'validating' | 'valid' | 'invalid';
}

export function SettingsModal({
  openaiKey,
  telegramBotToken,
  telegramChannelId,
  onOpenaiKeyChange,
  onTelegramBotTokenChange,
  onTelegramChannelIdChange,
  onValidateOpenaiKey,
  openaiKeyValidation
}: SettingsModalProps) {
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Telegram Integration State
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isIntegrating, setIsIntegrating] = useState(false);

  const { toast } = useToast();

  const handleOpenaiKeyChange = (value: string) => {
    onOpenaiKeyChange(value);
    if (value.length > 10) {
      // Debounce validation
      setTimeout(() => onValidateOpenaiKey(value), 500);
    }
  };

  const handleTelegramIntegration = async () => {
    if (!apiId || !apiHash || !phone || !targetUsername) {
      toast({
        title: "Missing fields",
        description: "Please fill in all Telegram integration fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsIntegrating(true);
      const response = await fetch('http://localhost:8000/api/integrate_telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_id: apiId,
          api_hash: apiHash,
          phone: phone,
          target_username: targetUsername
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionName(data.session_name);
        toast({
          title: "Integration successful",
          description: `Telegram session created: ${data.session_name}`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Integration failed",
          description: errorData.message || "Failed to integrate with Telegram",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Integration failed",
        description: "Network error while integrating with Telegram",
        variant: "destructive"
      });
    } finally {
      setIsIntegrating(false);
    }
  };

  const getOpenaiValidationIcon = () => {
    switch (openaiKeyValidation) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'validating':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getValidationBadge = () => {
    switch (openaiKeyValidation) {
      case 'valid':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success/30">Valid</Badge>;
      case 'invalid':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">Invalid</Badge>;
      case 'validating':
        return <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">Validating...</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-sm border-border hover:bg-secondary/50"
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Settings Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-card border-l border-border shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">API Configuration</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground mb-6">
              Configure your API keys and Telegram settings
            </p>

            <div className="space-y-6 py-4">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-key" className="text-sm font-medium text-foreground">
                    OpenAI API Key
                  </Label>
                  {getValidationBadge()}
                </div>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => handleOpenaiKeyChange(e.target.value)}
                    className="pr-16 bg-input/50 border-border text-foreground"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                    {getOpenaiValidationIcon()}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    >
                      {showOpenaiKey ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for generating messages via ChatGPT API
                </p>
              </div>

              {/* Telegram Bot Token */}
              <div className="space-y-2">
                <Label htmlFor="telegram-token" className="text-sm font-medium text-foreground">
                  Telegram Bot Token
                </Label>
                <div className="relative">
                  <Input
                    id="telegram-token"
                    type={showTelegramToken ? 'text' : 'password'}
                    placeholder="123456789:ABC-DEF..."
                    value={telegramBotToken}
                    onChange={(e) => onTelegramBotTokenChange(e.target.value)}
                    className="pr-10 bg-input/50 border-border text-foreground"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 h-auto p-0 pr-3 hover:bg-transparent"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                  >
                    {showTelegramToken ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get from @BotFather on Telegram
                </p>
              </div>

              {/* Telegram Channel ID */}
              <div className="space-y-2">
                <Label htmlFor="telegram-channel" className="text-sm font-medium text-foreground">
                  Telegram Channel ID
                </Label>
                <Input
                  id="telegram-channel"
                  type="text"
                  placeholder="@yourchannel or -1001234567890"
                  value={telegramChannelId}
                  onChange={(e) => onTelegramChannelIdChange(e.target.value)}
                  className="bg-input/50 border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Channel username (@channel) or numeric ID
                </p>
              </div>

              {/* Telegram Integration Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <Label className="text-sm font-medium text-foreground">
                    Telegram Integration
                  </Label>
                  {sessionName && (
                    <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                      Connected: {sessionName}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="api-id" className="text-sm font-medium text-foreground">
                      API ID
                    </Label>
                    <Input
                      id="api-id"
                      type="text"
                      placeholder="12345678"
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      className="bg-input/50 border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get from my.telegram.org
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api-hash" className="text-sm font-medium text-foreground">
                      API Hash
                    </Label>
                    <Input
                      id="api-hash"
                      type="password"
                      placeholder="abcdef1234567890abcdef1234567890"
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      className="bg-input/50 border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get from my.telegram.org
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-input/50 border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-username" className="text-sm font-medium text-foreground">
                      Target Username
                    </Label>
                    <Input
                      id="target-username"
                      type="text"
                      placeholder="@username or channel name"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      className="bg-input/50 border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Username or channel to send messages to
                    </p>
                  </div>

                  <Button
                    onClick={handleTelegramIntegration}
                    disabled={isIntegrating || !apiId || !apiHash || !phone || !targetUsername}
                    className="w-full bg-gradient-primary text-primary-foreground"
                  >
                    {isIntegrating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Integrating...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Integrate Telegram
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-border mt-6">
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-gradient-primary text-primary-foreground"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}