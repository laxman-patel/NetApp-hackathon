import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  AlertCircle,
  Database,
  Cloud,
  Server,
  ArrowRightLeft,
  Zap,
  DollarSign,
  RotateCw,
} from "lucide-react";

// Types for your existing data structures
interface StorageMetrics {
  environment: "aws-s3" | "aws-glacier" | "cloudflare-r2" | "minio";
  totalSizeGB: number;
  hotDataGB: number;
  warmDataGB: number;
  coldDataGB: number;
  costPerMonth: number;
  latencyMs: number;
  objectCount: number;
}

interface MigrationJob {
  id: string;
  source: string;
  destination: string;
  status: "running" | "completed" | "failed" | "pending";
  progress: number;
  objectsTransferred: number;
  totalObjects: number;
  throughputMBps: number;
  startTime: string;
}

interface StreamActivity {
  id: string;
  topic: string;
  partition: number;
  messagesPerSecond: number;
  avgLatencyMs: number;
  timestamp: string;
}

interface MLRecommendation {
  id: string;
  dataPattern: string;
  recommendation: "migrate" | "tier-change" | "compress" | "archive";
  sourceEnv: string;
  targetEnv: string;
  confidence: number;
  estimatedSavings: number;
}

// Main Dashboard Component
export default function DataManagementDashboard() {
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics[]>([]);
  const [migrations, setMigrations] = useState<MigrationJob[]>([]);
  const [streamActivities, setStreamActivities] = useState<StreamActivity[]>(
    [],
  );
  const [recommendations, setRecommendations] = useState<MLRecommendation[]>(
    [],
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ===== INTEGRATION POINTS FOR YOUR EXISTING CODE =====

  // TODO: Replace this with your data classifier service
  const fetchStorageMetrics = useCallback(async () => {
    // PLACEHOLDER: Call your data classifier API
    // const response = await fetch('/api/classifier/metrics');
    // const data = await response.json();

    // MOCK DATA - Replace with actual API call
    return [
      {
        environment: "aws-s3",
        totalSizeGB: 4500,
        hotDataGB: 1200,
        warmDataGB: 2000,
        coldDataGB: 1300,
        costPerMonth: 112.5,
        latencyMs: 45,
        objectCount: 125000,
      },
      {
        environment: "aws-glacier",
        totalSizeGB: 8500,
        hotDataGB: 0,
        warmDataGB: 500,
        coldDataGB: 8000,
        costPerMonth: 20.4,
        latencyMs: 450,
        objectCount: 85000,
      },
      {
        environment: "cloudflare-r2",
        totalSizeGB: 3200,
        hotDataGB: 800,
        warmDataGB: 1400,
        coldDataGB: 1000,
        costPerMonth: 0,
        latencyMs: 25,
        objectCount: 45000,
      },
      {
        environment: "minio",
        totalSizeGB: 1800,
        hotDataGB: 900,
        warmDataGB: 600,
        coldDataGB: 300,
        costPerMonth: 45,
        latencyMs: 5,
        objectCount: 28000,
      },
    ] as StorageMetrics[];
  }, []);

  // TODO: Replace this with your migration datastore query
  const fetchMigrationJobs = useCallback(async () => {
    // PLACEHOLDER: Query your migration datastore
    // const response = await fetch('/api/migrations/status');
    // const data = await response.json();

    // MOCK DATA - Replace with actual migration datastore call
    return [
      {
        id: "mig-001",
        source: "aws-s3",
        destination: "cloudflare-r2",
        status: "running",
        progress: 67,
        objectsTransferred: 83750,
        totalObjects: 125000,
        throughputMBps: 150,
        startTime: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "mig-002",
        source: "minio",
        destination: "aws-glacier",
        status: "completed",
        progress: 100,
        objectsTransferred: 28000,
        totalObjects: 28000,
        throughputMBps: 95,
        startTime: new Date(Date.now() - 86400000).toISOString(),
      },
    ] as MigrationJob[];
  }, []);

  // TODO: Replace this with your Kafka/MQTT stream consumer
  const fetchStreamActivities = useCallback(async () => {
    // PLACEHOLDER: Subscribe to your Kafka/MQTT topic
    // const eventSource = new EventSource('/api/stream/activities');
    // eventSource.onmessage = (event) => { ... }

    // MOCK DATA - Replace with real-time stream integration
    return [
      {
        id: "stream-001",
        topic: "data-ingestion",
        partition: 0,
        messagesPerSecond: 1250,
        avgLatencyMs: 12,
        timestamp: new Date().toISOString(),
      },
      {
        id: "stream-002",
        topic: "migration-events",
        partition: 1,
        messagesPerSecond: 85,
        avgLatencyMs: 8,
        timestamp: new Date().toISOString(),
      },
    ] as StreamActivity[];
  }, []);

  // TODO: Replace this with your ML model inference
  const fetchMLRecommendations = useCallback(async () => {
    // PLACEHOLDER: Call your ML model API
    // const response = await fetch('/api/ml/recommendations', {
    //   method: 'POST',
    //   body: JSON.stringify(storageMetrics)
    // });

    // MOCK DATA - Replace with actual ML model predictions
    return [
      {
        id: "rec-001",
        dataPattern: "monthly_report_*.parquet",
        recommendation: "migrate",
        sourceEnv: "aws-s3",
        targetEnv: "aws-glacier",
        confidence: 0.92,
        estimatedSavings: 340,
      },
      {
        id: "rec-002",
        dataPattern: "user_uploads/*",
        recommendation: "tier-change",
        sourceEnv: "minio",
        targetEnv: "minio",
        confidence: 0.87,
        estimatedSavings: 45,
      },
    ] as MLRecommendation[];
  }, []);

  // =======================================================

  // Auto-refresh dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [metrics, jobs, streams, recs] = await Promise.all([
          fetchStorageMetrics(),
          fetchMigrationJobs(),
          fetchStreamActivities(),
          fetchMLRecommendations(),
        ]);

        setStorageMetrics(metrics);
        setMigrations(jobs);
        setStreamActivities(streams);
        setRecommendations(recs);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [
    fetchStorageMetrics,
    fetchMigrationJobs,
    fetchStreamActivities,
    fetchMLRecommendations,
  ]);

  // Derived metrics for visualizations
  const totalStorage = storageMetrics.reduce(
    (acc, m) => acc + m.totalSizeGB,
    0,
  );
  const totalCost = storageMetrics.reduce((acc, m) => acc + m.costPerMonth, 0);
  const activeMigrations = migrations.filter(
    (m) => m.status === "running",
  ).length;
  const avgLatency =
    storageMetrics.reduce((acc, m) => acc + m.latencyMs, 0) /
      storageMetrics.length || 0;

  // Data transformation for charts
  const storageDistributionData = storageMetrics.map((m) => ({
    name: m.environment.toUpperCase().replace("-", " "),
    value: m.totalSizeGB,
    cost: m.costPerMonth,
  }));

  const tierDistributionData = [
    {
      name: "Hot Data",
      value: storageMetrics.reduce((acc, m) => acc + m.hotDataGB, 0),
    },
    {
      name: "Warm Data",
      value: storageMetrics.reduce((acc, m) => acc + m.warmDataGB, 0),
    },
    {
      name: "Cold Data",
      value: storageMetrics.reduce((acc, m) => acc + m.coldDataGB, 0),
    },
  ];

  const latencyCostData = storageMetrics.map((m) => ({
    environment: m.environment.toUpperCase().replace("-", " "),
    latency: m.latencyMs,
    cost: m.costPerMonth,
    size: m.totalSizeGB,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      running: "bg-blue-500",
      completed: "bg-green-500",
      failed: "bg-red-500",
      pending: "bg-yellow-500",
    };

    return (
      <Badge className={variants[status] || "bg-gray-500"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Data in Motion Dashboard
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-time intelligent data management across hybrid cloud
            <span className="ml-auto text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Storage
              </CardTitle>
              <Database className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(totalStorage / 1000).toFixed(1)} TB
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Across {storageMetrics.length} environments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Cost
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <p className="text-xs text-green-600 mt-1">
                ↓ $340 potential savings identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Migrations
              </CardTitle>
              <ArrowRightLeft className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMigrations}</div>
              <p className="text-xs text-gray-500 mt-1">
                {migrations.filter((m) => m.status === "completed").length}{" "}
                completed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Latency
              </CardTitle>
              <Zap className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgLatency.toFixed(0)}ms
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Real-time stream active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="storage">Storage Details</TabsTrigger>
            <TabsTrigger value="migrations">Migrations</TabsTrigger>
            <TabsTrigger value="streams">Real-time Streams</TabsTrigger>
            <TabsTrigger value="insights">ML Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Storage Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Storage Distribution</CardTitle>
                  <CardDescription>
                    Data distribution across cloud environments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={storageDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        // eslint-disable-next-line
                        // @ts-ignore
                        label={(parameters: {
                          name: string;
                          percent: number;
                        }) => {
                          return `${parameters.name}\n${(parameters.percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {storageDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(0)} GB`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Data Tier Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Temperature Tiers</CardTitle>
                  <CardDescription>
                    Hot/Warm/Cold data classification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tierDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(0)} GB`}
                      />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Latency vs Cost Scatter */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Cost vs Performance Analysis</CardTitle>
                  <CardDescription>
                    Storage cost effectiveness by environment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={latencyCostData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="environment" />
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: "Latency (ms)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{
                          value: "Cost ($)",
                          angle: 90,
                          position: "insideRight",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="latency"
                        stroke="#ef4444"
                        fill="#fca5a5"
                        name="Latency (ms)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="cost"
                        stroke="#10b981"
                        fill="#a7f3d0"
                        name="Cost ($/month)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment Details</CardTitle>
                <CardDescription>
                  Detailed metrics per storage environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storageMetrics.map((env) => (
                    <div
                      key={env.environment}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {env.environment === "aws-s3" && (
                            <Cloud className="w-5 h-5 text-orange-500" />
                          )}
                          {env.environment === "aws-glacier" && (
                            <Cloud className="w-5 h-5 text-blue-600" />
                          )}
                          {env.environment === "cloudflare-r2" && (
                            <Cloud className="w-5 h-5 text-orange-600" />
                          )}
                          {env.environment === "minio" && (
                            <Server className="w-5 h-5 text-gray-600" />
                          )}
                          <span className="font-semibold capitalize">
                            {env.environment.replace("-", " ")}
                          </span>
                        </div>
                        <Badge
                          variant={env.latencyMs < 50 ? "default" : "secondary"}
                        >
                          {env.latencyMs}ms latency
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Size:</span>
                          <div className="font-semibold">
                            {(env.totalSizeGB / 1000).toFixed(2)} TB
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Objects:</span>
                          <div className="font-semibold">
                            {env.objectCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Monthly Cost:</span>
                          <div className="font-semibold">
                            ${env.costPerMonth.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Data Tiers:</span>
                          <div className="font-semibold">
                            {env.hotDataGB > 0 && (
                              <span className="text-red-500">
                                H:{env.hotDataGB}GB{" "}
                              </span>
                            )}
                            {env.warmDataGB > 0 && (
                              <span className="text-yellow-500">
                                W:{env.warmDataGB}GB{" "}
                              </span>
                            )}
                            {env.coldDataGB > 0 && (
                              <span className="text-blue-500">
                                C:{env.coldDataGB}GB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Migrations Tab */}
          <TabsContent value="migrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Migration Jobs</CardTitle>
                    <CardDescription>
                      Track data movement across environments
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      /* TODO: Trigger new migration */
                    }}
                  >
                    <RotateCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {migrations.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={job.status} />
                          <span className="font-mono text-sm">{job.id}</span>
                          <span className="text-gray-600">
                            {job.source} → {job.destination}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {job.objectsTransferred.toLocaleString()} /{" "}
                          {job.totalObjects.toLocaleString()} objects
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Throughput:</span>
                          <div className="font-semibold">
                            {job.throughputMBps} MB/s
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <div className="font-semibold">
                            {new Date(job.startTime).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">ETA:</span>
                          <div className="font-semibold">
                            {job.status === "running"
                              ? "~45 mins"
                              : "Completed"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streams Tab */}
          <TabsContent value="streams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Stream Activity</CardTitle>
                <CardDescription>
                  Live data ingestion from Kafka/MQTT topics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Connected to message stream
                  </div>

                  {streamActivities.map((stream) => (
                    <div key={stream.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold">{stream.topic}</span>
                          <Badge variant="outline">
                            Partition {stream.partition}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(stream.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Messages/sec:</span>
                          <div className="font-semibold text-green-600">
                            {stream.messagesPerSecond.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Latency:</span>
                          <div className="font-semibold">
                            {stream.avgLatencyMs}ms
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="font-semibold text-green-600">
                            Active
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Real-time Chart Placeholder */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stream Throughput (Last 5 Minutes)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={
                            /* TODO: Connect to real-time stream buffer */ []
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="throughput"
                            stroke="#3b82f6"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="text-center text-gray-500 text-sm mt-4">
                        Connect your Kafka/MQTT consumer to populate this chart
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ML Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Recommendations</CardTitle>
                <CardDescription>
                  AI-powered insights from your ML model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="border rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Pattern:</span>
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                              {rec.dataPattern}
                            </code>
                            <Badge
                              className={
                                rec.confidence > 0.9
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                              }
                            >
                              {Math.round(rec.confidence * 100)}% confidence
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Recommendation:</span>{" "}
                            {rec.recommendation === "migrate" &&
                              `Migrate from ${rec.sourceEnv} to ${rec.targetEnv}`}
                            {rec.recommendation === "tier-change" &&
                              `Change tier within ${rec.sourceEnv}`}
                            {rec.recommendation === "compress" &&
                              `Apply compression to pattern`}
                            {rec.recommendation === "archive" &&
                              `Archive to ${rec.targetEnv}`}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600 font-semibold">
                              💰 Save ${rec.estimatedSavings}/month
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            // TODO: Implement recommendation execution
                            console.log(`Executing recommendation ${rec.id}`);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}

                  {recommendations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        No recommendations available. The ML model is analyzing
                        patterns...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Model Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>ML Model Performance</CardTitle>
                <CardDescription>
                  Track prediction accuracy and learning progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Prediction Accuracy
                    </div>
                    <div className="text-2xl font-bold">94.2%</div>
                    <div className="text-xs text-green-600">
                      ↑ 2.1% this week
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Patterns Identified
                    </div>
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs text-blue-600">+34 today</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      Avg Savings/Rec
                    </div>
                    <div className="text-2xl font-bold">$156</div>
                    <div className="text-xs text-gray-600">
                      Per recommendation
                    </div>
                  </div>
                </div>

                {/* TODO: Connect to your ML model training metrics */}
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={
                        /* TODO: Add your model's historical performance data */ []
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#3b82f6"
                        name="Accuracy"
                      />
                      <Line
                        type="monotone"
                        dataKey="precision"
                        stroke="#10b981"
                        name="Precision"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
