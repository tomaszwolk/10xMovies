import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Props for EmptyState component.
 */
type EmptyStateProps = {
  variant: 'no-data' | 'rate-limited' | 'no-suggestions' | 'error';
  message?: string;
};

/**
 * Empty state component for different AI suggestions scenarios.
 * Provides appropriate messaging and call-to-action for each variant.
 */
export function EmptyState({ variant, message }: EmptyStateProps) {
  const navigate = useNavigate();

  const getContent = () => {
    switch (variant) {
      case 'no-data':
        return {
          icon: <Search className="h-12 w-12 text-muted-foreground" />,
          title: "Brak wystarczających danych",
          description: "Dodaj więcej filmów do swojej watchlisty lub oznacz jako obejrzane, aby AI mogło wygenerować spersonalizowane sugestie.",
          action: (
            <Button onClick={() => navigate('/app/watchlist')} variant="default">
              Przejdź do watchlisty
            </Button>
          ),
        };

      case 'rate-limited':
        return {
          icon: <Clock className="h-12 w-12 text-muted-foreground" />,
          title: "Limit wykorzystany",
          description: message || "Dzisiejszy limit sugestii AI został wykorzystany. Nowe sugestie będą dostępne jutro.",
          action: null,
        };

      case 'no-suggestions':
        return {
          icon: <Sparkles className="h-12 w-12 text-muted-foreground" />,
          title: "Brak sugestii",
          description: message || "Nie udało się znaleźć sugestii pasujących do Twoich preferencji. Spróbuj ponownie później.",
          action: (
            <Button onClick={() => window.location.reload()} variant="outline">
              Spróbuj ponownie
            </Button>
          ),
        };

      case 'error':
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
          title: "Wystąpił błąd",
          description: message || "Nie udało się pobrać sugestii. Sprawdź połączenie internetowe i spróbuj ponownie.",
          action: (
            <Button onClick={() => window.location.reload()} variant="outline">
              Spróbuj ponownie
            </Button>
          ),
        };

      default:
        return {
          icon: <Sparkles className="h-12 w-12 text-muted-foreground" />,
          title: "Brak sugestii",
          description: "Aktualnie nie ma dostępnych sugestii.",
          action: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-6">
        {content.icon}
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {content.title}
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        {content.description}
      </p>

      {content.action && (
        <div className="flex justify-center">
          {content.action}
        </div>
      )}
    </div>
  );
}
