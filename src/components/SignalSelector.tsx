import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

const SIGNAL_TYPES = [
  'btc', 'top_5m', 'top_15m', 'top_30m', 'top_1h', 'top2h',
  'top_4h', 'top_6h', 'top_8h', 'top_12h', 'top_1d',
  'fr', 'vol', 'oi15', 'oi30', 'oi60', 'upbit'
];

interface SignalSelectorProps {
  selectedTypes: string[];
  onSelectionChange: (types: string[]) => void;
  fetchedData: Record<string, any>;
  onFetchData: (type: string) => void;
  isLoading: boolean;
}

export function SignalSelector({
  selectedTypes,
  onSelectionChange,
  fetchedData,
  onFetchData,
  isLoading
}: SignalSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onSelectionChange(selectedTypes.filter(t => t !== type));
    } else {
      onSelectionChange([...selectedTypes, type]);
      onFetchData(type);
    }
  };

  const displayTypes = showAll ? SIGNAL_TYPES : SIGNAL_TYPES.slice(0, 8);

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow"></div>
          Signal Data Fetcher
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Select signal types to fetch data from the API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {displayTypes.map((type, index) => {
            const isSelected = selectedTypes.includes(type);
            const hasFetched = fetchedData[type];

            return (
              <Button
                key={type}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeToggle(type)}
                className={`
                  relative transition-all duration-300 animate-fade-in
                  ${isSelected
                    ? 'bg-gradient-primary text-primary-foreground shadow-primary border-0'
                    : 'hover:border-primary/50 hover:bg-secondary/50'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
                disabled={isLoading}
              >
                {isSelected && <Plus className="w-3 h-3 mr-1" />}
                {type}
                {hasFetched && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-bounce-in" />
                )}
              </Button>
            );
          })}
        </div>

        {SIGNAL_TYPES.length > 8 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAll ? 'Show Less' : `Show ${SIGNAL_TYPES.length - 8} More`}
          </Button>
        )}

        {selectedTypes.length > 0 && (
          <div className="animate-slide-up">
            <h4 className="text-sm font-medium text-foreground mb-2">Selected Types:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="bg-secondary/50 text-secondary-foreground border border-border animate-bounce-in"
                >
                  {type}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0 h-auto w-auto hover:bg-transparent"
                    onClick={() => handleTypeToggle(type)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}