import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMovieSearch } from "@/hooks/useMovieSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Loader2, Search, ImageIcon } from "lucide-react";
import type { SearchOptionVM } from "@/types/api.types";

/**
 * Props for SearchCombobox component.
 */
type SearchComboboxProps = {
  onAdd: (tconst: string) => void;
  existingTconsts: string[];
};

/**
 * Search combobox for adding movies to watchlist.
 * Provides debounced search with autocomplete functionality.
 */
export function SearchCombobox({ onAdd, existingTconsts }: SearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const movieSearch = useMovieSearch(debouncedQuery);
  const results = movieSearch.data ?? [];
  const { isLoading, error } = movieSearch;

  // Reset popover when query changes
  useEffect(() => {
    if (query.length < 2) {
      setIsOpen(false);
    }
  }, [query]);

  const handleSelect = (result: SearchOptionVM) => {
    // Check if movie is already in watchlist
    if (existingTconsts.includes(result.tconst)) {
      return; // Don't add duplicates
    }

    onAdd(result.tconst);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Szukaj filmu..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10 pr-4"
          aria-label="Wyszukaj film"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="hidden" />
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
          style={{ width: inputRef.current?.offsetWidth }}
        >
          {error ? (
            <div className="p-4 text-sm text-red-600">
              Błąd podczas wyszukiwania. Spróbuj ponownie.
            </div>
          ) : null}

          {!error && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="p-4 text-sm text-gray-500">
              Brak wyników dla "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {results.slice(0, 10).map((result) => (
                <button
                  key={result.tconst}
                  onClick={() => handleSelect(result)}
                  disabled={existingTconsts.includes(result.tconst)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    {result.posterUrl ? (
                      <img
                        src={result.posterUrl}
                        alt={result.primaryTitle}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.primaryTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.startYear && `${result.startYear} • `}
                      {result.avgRating ? `${result.avgRating}/10` : "Brak oceny"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
