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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const movieSearch = useMovieSearch(debouncedQuery);
  const results = movieSearch.data ?? [];
  const { isLoading, error } = movieSearch;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Reset popover and active index when query changes
  useEffect(() => {
    if (query.length < 2) {
      setIsOpen(false);
      setActiveIndex(-1);
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
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          const selectedItem = results[activeIndex];
          if (!existingTconsts.includes(selectedItem.tconst)) {
            handleSelect(selectedItem);
          }
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const activeId = activeIndex >= 0 ? `result-${results[activeIndex]?.tconst}` : undefined;

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Szukaj filmu..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4 text-foreground placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-label="Wyszukaj film"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{ width: inputRef.current?.offsetWidth }}
        >
          {error ? (
            <div className="p-4 text-center text-destructive text-sm">
              Nie udało się pobrać wyników wyszukiwania. Spróbuj ponownie
            </div>
          ) : null}

          {!error && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Brak wyników dla "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {results.slice(0, 10).map((result, index) => (
                <button
                  key={result.tconst}
                  id={`result-${result.tconst}`}
                  onClick={() => handleSelect(result)}
                  disabled={existingTconsts.includes(result.tconst)}
                  className={`w-full flex items-center gap-3 p-3 text-left border-b border-border last:border-b-0 ${
                    index === activeIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-18 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {result.posterUrl ? (
                      <img
                        src={result.posterUrl}
                        alt={result.primaryTitle}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground">
                      {result.primaryTitle}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
