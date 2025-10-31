import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WatchedFiltersBar } from "../WatchedFiltersBar";

describe("WatchedFiltersBar", () => {
  it("renders hide button and counter when unavailable movies visible", () => {
    const onToggle = vi.fn();

    render(
      <WatchedFiltersBar
        hideUnavailable={false}
        onToggle={onToggle}
        visibleCount={3}
        totalCount={5}
        hasUserPlatforms
      />
    );

    const button = screen.getByRole("button", { name: /Ukryj niedostępne/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);

    expect(screen.getByText("Wyświetlane: 3/5")).toBeInTheDocument();
  });

  it("renders show button when unavailable movies are hidden", () => {
    render(
      <WatchedFiltersBar
        hideUnavailable
        onToggle={vi.fn()}
        visibleCount={2}
        totalCount={4}
        hasUserPlatforms
      />
    );

    expect(
      screen.getByRole("button", { name: /Pokaż niedostępne/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Wyświetlane: 2/4")).toBeInTheDocument();
  });

  it("disables button when user has no selected platforms", () => {
    render(
      <WatchedFiltersBar
        hideUnavailable={false}
        onToggle={vi.fn()}
        visibleCount={1}
        totalCount={1}
        hasUserPlatforms={false}
      />
    );

    const button = screen.getByRole("button", { name: /Ukryj niedostępne/i });
    expect(button).toBeDisabled();
  });
});


