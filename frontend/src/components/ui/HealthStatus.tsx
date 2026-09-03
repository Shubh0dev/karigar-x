"use client";

import React, { useState, useEffect } from "react";
import { Server, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export const HealthStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/health", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to backend";
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-artisan-terracotta">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Backend Connectivity</h4>
            <p className="text-[10px] text-slate-500">FastAPI Integration Status</p>
          </div>
        </div>

        {loading ? (
          <Badge variant="outline">
            <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
            Connecting...
          </Badge>
        ) : health ? (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Online (v{health.version})
          </Badge>
        ) : (
          <Badge variant="warning">
            <XCircle className="w-3 h-3 text-amber-600" />
            Offline
          </Badge>
        )}
      </div>

      <div className="text-xs text-slate-600 bg-white/80 rounded-xl p-3 border border-amber-100 mt-2">
        {loading ? (
          <div className="animate-pulse flex space-x-2 items-center">
            <div className="h-2 bg-slate-200 rounded w-full"></div>
          </div>
        ) : health ? (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Endpoint:</span>
              <span className="font-mono text-[11px] text-slate-700">/api/health</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-semibold text-emerald-700">{health.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp:</span>
              <span className="font-mono text-[10px] text-slate-500">
                {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-amber-800 text-[11px] mb-1 font-medium">
              Backend not detected on <code className="font-mono bg-amber-100 px-1 rounded text-amber-900">localhost:8000</code>
            </p>
            <p className="text-[10px] text-slate-500">
              Start backend using <code className="font-mono bg-slate-100 px-1">uvicorn main:app --reload --port 8000</code> inside <code className="font-mono">karigar-x/backend</code>.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={checkBackendHealth}
          disabled={loading}
          icon={<RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />}
        >
          Check Backend Connection
        </Button>
      </div>
    </div>
  );
};
