// dashboard/src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { STORAGE_SILOES } from "./storage_siloe";

interface DashboardData {
  datasets: any[];
  predictions: Record<string, any>;
  streamEvents: any[];
  migrations: any[];
  metrics: {
    totalSizeGB: number;
    totalDatasets: number;
    activeMigrations: number;
    potentialSavings: number;
  };
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/dashboard")
        .then((res) => res.json())
        .then(setData);
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* ===== METRICS CARDS ===== */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalSizeGB.toFixed(0)} GB
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.totalDatasets}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Migrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.metrics.activeMigrations}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.metrics.potentialSavings.toFixed(2)}/mo
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== REAL-TIME STREAM PANEL ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Live Data Access Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 overflow-y-auto border rounded p-2 font-mono text-xs">
            {data.streamEvents.map((event) => (
              <div key={event.id} className="flex justify-between py-1">
                <span className="text-gray-600">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-medium">{event.datasetId}</span>
                <Badge variant="outline">{event.accessType}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== DATA CLASSIFIER TABLE ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Data Classification & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Access (30d)</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.datasets.map((d) => {
                const needsMigration =
                  d.currentLocation !== d.recommendedLocation;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.sizeGB} GB</TableCell>
                    <TableCell>{d.accessCount30d}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          d.tier === "hot"
                            ? "bg-red-500"
                            : d.tier === "warm"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }
                      >
                        {d.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{d.latencySensitivity}</TableCell>
                    <TableCell>{d.currentLocation}</TableCell>
                    <TableCell>
                      {needsMigration && (
                        <Badge variant="outline" className="bg-green-50">
                          → {d.recommendedLocation}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {needsMigration && (
                        <Badge className="bg-orange-500">Migrate</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== ML PREDICTIONS PANEL ===== */}
      <Card>
        <CardHeader>
          <CardTitle>ML Predictions & Preemptive Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.predictions).map(([datasetId, pred]) => (
              <Card key={datasetId} className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-sm">{datasetId}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    Predicted (7d):{" "}
                    <span className="font-bold">
                      {pred.predictedAccessNext7d}
                    </span>
                  </div>
                  <div>
                    Confidence: <Badge>{pred.confidence}</Badge>
                  </div>
                  {pred.confidence === "high" && (
                    <div className="text-orange-600 font-medium">
                      ⏭️ Preemptive migration recommended
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== MIGRATION TIMELINE ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Active Migrations</CardTitle>
        </CardHeader>
        <CardContent>
          {data.migrations.length > 0 ? (
            data.migrations.map((m) => (
              <div
                key={m.migrationId}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <div className="font-medium">{m.datasetId}</div>
                  <div className="text-sm text-gray-600">
                    {m.from} → {m.to}
                  </div>
                </div>
                <Badge>{m.status}</Badge>
                <div className="text-sm">{m.progressPercent}%</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-8">
              No migrations in progress
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== COST SAVINGS CHART ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis by Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.values(STORAGE_SILOES).map((storage_siloe) => ({
                name: storage_siloe.provider,
                currentCost:
                  data.datasets
                    .filter((d) => d.currentLocation === storage_siloe.id)
                    .reduce(
                      (acc, d) =>
                        acc + d.sizeGB * storage_siloe.storageCostPerGBMonth,
                      0,
                    ) / 100,
                optimizedCost:
                  data.datasets
                    .filter((d) => d.recommendedLocation === storage_siloe.id)
                    .reduce(
                      (acc, d) =>
                        acc + d.sizeGB * storage_siloe.storageCostPerGBMonth,
                      0,
                    ) / 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}/mo`} />
              <Bar dataKey="currentCost" fill="#ef4444" name="Current Cost" />
              <Bar
                dataKey="optimizedCost"
                fill="#10b981"
                name="Optimized Cost"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
