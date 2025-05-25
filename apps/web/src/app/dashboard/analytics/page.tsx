"use client";

import { useState, useEffect } from "react";
import { Loader2, BarChart2, PieChart, LineChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Analytics {
  codeGenerationCount: number;
  codeReviewCount: number;
  successRate: number;
  averageResponseTime: number;
  languageDistribution: Record<string, number>;
  activitiesByDay: Record<string, number>;
  teamUsage?: Record<string, number>;
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeFrame, setTimeFrame] = useState<"week" | "month" | "year">("week");
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async (period: "week" | "month" | "year") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error fetching analytics",
        description: "There was an error fetching analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeFrame);
  }, [timeFrame]);

  const exportCSV = () => {
    if (!analytics) return;
    
    // Build CSV content
    const headers = ["Metric", "Value"];
    const rows = [
      ["Code Generations", analytics.codeGenerationCount],
      ["Code Reviews", analytics.codeReviewCount],
      ["Success Rate", `${analytics.successRate}%`],
      ["Average Response Time", `${analytics.averageResponseTime}ms`],
    ];
    
    // Add language distribution
    Object.entries(analytics.languageDistribution).forEach(([language, count]) => {
      rows.push([`Language: ${language}`, count]);
    });
    
    // Add daily activities
    Object.entries(analytics.activitiesByDay).forEach(([day, count]) => {
      rows.push([`Activity: ${day}`, count]);
    });
    
    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gendevai-analytics-${timeFrame}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        
        <div className="flex gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${timeFrame === "week" ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setTimeFrame("week")}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 text-sm ${timeFrame === "month" ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setTimeFrame("month")}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 text-sm ${timeFrame === "year" ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setTimeFrame("year")}
            >
              Year
            </button>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            disabled={!analytics || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : analytics ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Summary Cards */}
          <div className="rounded-md border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Code Generations</h3>
            <p className="mt-2 text-3xl font-bold">{analytics.codeGenerationCount}</p>
          </div>
          
          <div className="rounded-md border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Code Reviews</h3>
            <p className="mt-2 text-3xl font-bold">{analytics.codeReviewCount}</p>
          </div>
          
          <div className="rounded-md border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Success Rate</h3>
            <p className="mt-2 text-3xl font-bold">{analytics.successRate}%</p>
          </div>
          
          <div className="rounded-md border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Avg. Response Time</h3>
            <p className="mt-2 text-3xl font-bold">{analytics.averageResponseTime}ms</p>
          </div>
          
          {/* Charts */}
          <div className="col-span-full md:col-span-2 rounded-md border p-6">
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">Activities by Day</h2>
            </div>
            <div className="h-64 mt-4 flex items-end justify-between gap-2">
              {Object.entries(analytics.activitiesByDay).map(([day, count]) => (
                <div key={day} className="flex flex-col items-center">
                  <div 
                    className="bg-primary/80 w-12 rounded-t-md" 
                    style={{ height: `${Math.max((count / Math.max(...Object.values(analytics.activitiesByDay))) * 180, 20)}px` }}
                  />
                  <span className="text-xs mt-2">{day.substring(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-span-full md:col-span-2 rounded-md border p-6">
            <div className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">Language Distribution</h2>
            </div>
            <div className="mt-4">
              {Object.entries(analytics.languageDistribution).map(([language, count]) => {
                const percentage = Math.round((count / Object.values(analytics.languageDistribution).reduce((a, b) => a + b, 0)) * 100);
                return (
                  <div key={language} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {analytics.teamUsage && (
            <div className="col-span-full rounded-md border p-6">
              <div className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Team Usage</h2>
              </div>
              <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(analytics.teamUsage).map(([team, count]) => (
                  <div key={team} className="border rounded-md p-4">
                    <h3 className="font-medium text-sm">{team}</h3>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No analytics data available. Start using the platform to generate insights.
        </div>
      )}
    </div>
  );
}
