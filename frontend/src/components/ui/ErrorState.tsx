import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong. Please try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3 my-4">
      <div className="p-3 bg-rose-100 rounded-full text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-xs font-bold text-rose-900">{message}</h4>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Action
        </Button>
      )}
    </div>
  );
};
