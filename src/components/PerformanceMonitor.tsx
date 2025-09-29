import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  medicineCount: number;
  searchTime: number;
  lastSearch: string;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isVisible?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  metrics, 
  isVisible = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Performance Monitor
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-blue-500" />
                <span>Database:</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {metrics.medicineCount.toLocaleString()} medicines
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>Load Time:</span>
              </div>
              <Badge 
                variant={metrics.loadTime < 1 ? "default" : metrics.loadTime < 3 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {metrics.loadTime.toFixed(2)}s
              </Badge>
            </div>

            {metrics.searchTime > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-green-500" />
                  <span>Search:</span>
                </div>
                <Badge 
                  variant={metrics.searchTime < 0.1 ? "default" : metrics.searchTime < 0.5 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {metrics.searchTime.toFixed(3)}s
                </Badge>
              </div>
            )}

            {isExpanded && metrics.lastSearch && (
              <div className="text-xs text-gray-600 pt-2 border-t">
                <div className="font-medium">Last Search:</div>
                <div className="truncate">"{metrics.lastSearch}"</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;

