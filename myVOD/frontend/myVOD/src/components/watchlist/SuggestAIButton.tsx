import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

/**
 * Props for SuggestAIButton component.
 */
type SuggestAIButtonProps = {
  onClick: () => void;
  disabled: boolean;
};

/**
 * Button for requesting AI-powered movie suggestions.
 * Includes tooltip explaining the feature and disabled state handling.
 */
export function SuggestAIButton({ onClick, disabled }: SuggestAIButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
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
          {disabled ? (
            <p>Limit sugestii AI został osiągnięty. Spróbuj ponownie później.</p>
          ) : (
            <p>Zapytaj AI o spersonalizowane sugestie filmów na podstawie Twojej listy</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
