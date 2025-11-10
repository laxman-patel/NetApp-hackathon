import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Database,
  TrendingUp,
  Zap,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_BASE = "http://localhost:3001/api";

interface MigrationJob {
  id: string;
  datasetName: string;
  source: string;
  destination: string;
  status: "running" | "completed" | "failed";
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  throughputMBps: number;
  startTime: string;
  endTime?: string;
}

interface DatasetMetadata {
  name: string;
  sizeGB: number;
  accessCount30d: number;
  lastAccessed: string;
  currentLocation: string;
  latencySensitivity: string;
  egressPattern: string;
  businessPriority: number;
}

interface Prediction {
  recommendedLocation: string;
  tier: "hot" | "warm" | "cold";
  estimatedMonthlyCost: number;
}

const STORAGE_COLORS = {
  "minio-on-prem": "#8B5CF6",
  "aws-s3-vanilla": "#FF9500",
  "cloudflare-r2": "#F97316",
  "aws-glacier": "#06B6D4",
};

const TIER_COLORS = {
  hot: "#EF4444",
  warm: "#F59E0B",
  cold: "#3B82F6",
};

const Dashboard: React.FC = () => {
  const [migrations, setMigrations] = useState<MigrationJob[]>([]);
  const [dataStore, setDataStore] = useState<Record<string, DatasetMetadata>>(
    {},
  );
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(
    {},
  );
  const [streamEvents, setStreamEvents] = useState<
    Array<{ id: string; dataset: string; time: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const [migrationsRes, dataStoreRes, predictionsRes] = await Promise.all([
        fetch(`${API_BASE}/getMigrations`),
        fetch(`${API_BASE}/getDataStore`),
        fetch(`${API_BASE}/getPredictions`),
      ]);

      const migrationsData = await migrationsRes.json();
      const dataStoreData = await dataStoreRes.json();
      const predictionsData = await predictionsRes.json();

      setMigrations(migrationsData);
      setDataStore(dataStoreData);
      setPredictions(predictionsData);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const executeClassification = async () => {
    try {
      await fetch(`${API_BASE}/executeClassifications`, { method: "POST" });
      fetchData();
    } catch (error) {
      console.error("Failed to execute classification:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    // Simulate stream events
    const streamInterval = setInterval(() => {
      const datasets = Object.keys(dataStore);
      if (datasets.length > 0) {
        const randomDataset =
          datasets[Math.floor(Math.random() * datasets.length)];
        setStreamEvents((prev) => [
          {
            id: Math.random().toString(36).substr(2, 9),
            dataset: randomDataset,
            time: new Date().toISOString(),
          },
          ...prev.slice(0, 9), // Keep last 10 events
        ]);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(streamInterval);
    };
  }, [dataStore]);

  // Calculate metrics
  const datasets = Object.values(dataStore);
  const totalDataGB = datasets.reduce((sum, d) => sum + d.sizeGB, 0);
  const totalAccessCount = datasets.reduce(
    (sum, d) => sum + d.accessCount30d,
    0,
  );
  const totalCost = Object.entries(predictions).reduce(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (sum, [_, p]) => sum + p.estimatedMonthlyCost,
    0,
  );
  const activeMigrations = migrations.filter(
    (m) => m.status === "running",
  ).length;

  // Storage distribution data
  const storageDistribution = datasets.reduce(
    (acc, dataset) => {
      const location = dataset.currentLocation || "unknown";
      acc[location] = (acc[location] || 0) + dataset.sizeGB;
      return acc;
    },
    {} as Record<string, number>,
  );

  const storageChartData = Object.entries(storageDistribution).map(
    ([name, value]) => ({
      name: name.replace(/-/g, " ").toUpperCase(),
      value: Math.round(value * 100) / 100,
      fill: STORAGE_COLORS[name as keyof typeof STORAGE_COLORS] || "#94A3B8",
    }),
  );

  // Tier distribution
  const tierDistribution = Object.values(predictions).reduce(
    (acc, pred) => {
      acc[pred.tier] = (acc[pred.tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const tierChartData = Object.entries(tierDistribution).map(
    ([tier, count]) => ({
      tier: tier.toUpperCase(),
      count,
      fill: TIER_COLORS[tier as keyof typeof TIER_COLORS],
    }),
  );

  // Migration throughput over time (for running migrations)
  const throughputData = migrations
    .filter((m) => m.status === "running")
    .map((m) => ({
      name: m.datasetName.substring(0, 20),
      throughput: Math.round(m.throughputMBps * 10) / 10,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Intelligent Cloud Storage Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Data in Motion - NetApp Hackathon
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Last updated:{" "}
              {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </span>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={executeClassification} variant="default" size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Run Classification
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Total Data
              </CardTitle>
              <Database className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {totalDataGB.toFixed(2)} GB
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Across {datasets.length} datasets
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Monthly Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                ${totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Optimized storage costs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Active Migrations
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {activeMigrations}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {migrations.length} total jobs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Access Events (30d)
              </CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {totalAccessCount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time monitoring
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="migrations">Migrations</TabsTrigger>
            <TabsTrigger value="streaming">Real-Time Stream</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Storage Distribution */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    Storage Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Data across cloud providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={storageChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}GB`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {storageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          color: "#f1f5f9",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Data Tier Distribution */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    Data Tier Distribution
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Hot, Warm, and Cold data classification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tierChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="tier" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]}>
                        {tierChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Migration Throughput */}
            {throughputData.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    Active Migration Throughput
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Current data transfer rates (MB/s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={throughputData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Bar
                        dataKey="throughput"
                        fill="#8B5CF6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Migrations Tab */}
          <TabsContent value="migrations" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Migration Jobs</CardTitle>
                <CardDescription className="text-slate-400">
                  Track data movement across storage environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-300">Dataset</TableHead>
                      <TableHead className="text-slate-300">
                        Source → Destination
                      </TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Progress</TableHead>
                      <TableHead className="text-slate-300">
                        Throughput
                      </TableHead>
                      <TableHead className="text-slate-300">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {migrations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-slate-400"
                        >
                          No migration jobs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      migrations.map((migration) => (
                        <TableRow
                          key={migration.id}
                          className="border-slate-800"
                        >
                          <TableCell className="font-medium text-slate-200">
                            {migration.datasetName}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <span className="text-xs">
                              {migration.source} → {migration.destination}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                migration.status === "completed"
                                  ? "default"
                                  : migration.status === "running"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={
                                migration.status === "completed"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : migration.status === "running"
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                              }
                            >
                              {migration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress
                                value={migration.progress}
                                className="h-2"
                              />
                              <span className="text-xs text-slate-400">
                                {migration.progress}% (
                                {(
                                  migration.bytesTransferred /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB /{" "}
                                {(migration.totalBytes / 1024 / 1024).toFixed(
                                  2,
                                )}{" "}
                                MB)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {migration.throughputMBps.toFixed(2)} MB/s
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {formatDistanceToNow(
                              new Date(migration.startTime),
                              { addSuffix: true },
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streaming Tab */}
          <TabsContent value="streaming" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                  Real-Time Data Access Events
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Live MQTT stream monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {streamEvents.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      Waiting for stream events...
                    </div>
                  ) : (
                    streamEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 animate-in slide-in-from-top-2"
                      >
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span className="text-slate-200 font-mono text-sm">
                            {event.dataset}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(event.time), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Dataset Overview
                </CardTitle>
                <CardDescription className="text-slate-400">
                  All datasets with predictions and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Size</TableHead>
                      <TableHead className="text-slate-300">Location</TableHead>
                      <TableHead className="text-slate-300">Tier</TableHead>
                      <TableHead className="text-slate-300">
                        Access (30d)
                      </TableHead>
                      <TableHead className="text-slate-300">
                        Est. Cost/Mo
                      </TableHead>
                      <TableHead className="text-slate-300">
                        Last Access
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasets.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-slate-400"
                        >
                          No datasets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      datasets.map((dataset) => {
                        const prediction = predictions[dataset.name];
                        return (
                          <TableRow
                            key={dataset.name}
                            className="border-slate-800"
                          >
                            <TableCell className="font-medium text-slate-200">
                              {dataset.name}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {dataset.sizeGB.toFixed(2)} GB
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                              >
                                {dataset.currentLocation
                                  ?.replace(/-/g, " ")
                                  .toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {prediction && (
                                <Badge
                                  variant="outline"
                                  className={
                                    prediction.tier === "hot"
                                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                                      : prediction.tier === "warm"
                                        ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  }
                                >
                                  {prediction.tier.toUpperCase()}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {dataset.accessCount30d.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              $
                              {prediction?.estimatedMonthlyCost.toFixed(2) ||
                                "N/A"}
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {formatDistanceToNow(
                                new Date(dataset.lastAccessed),
                                { addSuffix: true },
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
