import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type ErrorAlertProps = {
  message?: string;
};

/**
 * Global error alert component with accessibility features.
 * Automatically focuses on mount for screen reader announcements.
 */
export function ErrorAlert({ message }: ErrorAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the alert when it appears for accessibility
    if (message && alertRef.current) {
      alertRef.current.focus();
    }
  }, [message]);

  if (!message) return null;

  return (
    <Alert
      ref={alertRef}
      variant="destructive"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="mb-4 bg-red-900/20 border-red-800 text-red-200"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

