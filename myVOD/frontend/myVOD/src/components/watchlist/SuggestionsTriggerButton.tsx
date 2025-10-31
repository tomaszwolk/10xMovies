import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Props for SuggestionsTriggerButton component.
 */
type SuggestionsTriggerButtonProps = {
  disabled?: boolean;
  nextAvailableAt?: Date | null;
};

/**
 * Button for triggering AI suggestions view.
 * Navigates to /app/suggestions route with modal state.
 * Includes tooltip with rate limit information.
 */
export function SuggestionsTriggerButton({ disabled, nextAvailableAt }: SuggestionsTriggerButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    navigate('/app/suggestions', { state: { asModal: true } });
  };

  const getTooltipText = () => {
    if (disabled && nextAvailableAt) {
      const now = new Date();
      const diffMs = nextAvailableAt.getTime() - now.getTime();
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      return `Możesz otrzymać nowe sugestie za ${hours}h`;
    }
    if (disabled) {
      return "Limit sugestii AI został osiągnięty. Spróbuj ponownie później.";
    }
    return "Zapytaj AI o spersonalizowane sugestie filmów na podstawie Twojej listy";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Zasugeruj filmy
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
