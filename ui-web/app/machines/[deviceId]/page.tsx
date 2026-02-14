"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { getDeviceById, Device } from "@/lib/deviceApi";
import {
  getTelemetry,
  getDeviceStats,
  TelemetryPoint,
  DeviceStats,
} from "@/lib/dataApi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TimeSeriesChart } from "@/components/charts/telemetry-charts";
import { MachineRulesView } from "@/app/machines/[deviceId]/rules/machine-rules-view";

export default function MachineDashboardPage() {
  const params = useParams();
  const deviceId = (params.deviceId as string) || "";

  const [machine, setMachine] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "telemetry" | "rules"
  >("overview");

  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [machineData, telemetryData, statsData] = await Promise.all([
          getDeviceById(deviceId),
          getTelemetry(deviceId, { limit: "100" }),
          getDeviceStats(deviceId),
        ]);

        setMachine(machineData);
        setTelemetry(telemetryData);
        setStats(statsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch machine data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading machine data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">
            Error loading machine
          </h2>
          <p className="text-red-600">{error || "Machine not found"}</p>
          <Link href="/machines">
            <Button variant="outline" className="mt-4">
              Back to Machines
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestTelemetry = telemetry.at(-1);

  const power = latestTelemetry?.power;
  const voltage = latestTelemetry?.voltage;
  const temperature = latestTelemetry?.temperature;

  const powerData = telemetry
    .filter((t) => typeof t.power === "number")
    .map((t) => ({
      timestamp: t.timestamp,
      value: t.power as number,
    }));

  const voltageData = telemetry
    .filter((t) => typeof t.voltage === "number")
    .map((t) => ({
      timestamp: t.timestamp,
      value: t.voltage as number,
    }));

  const temperatureData = telemetry
    .filter((t) => typeof t.temperature === "number")
    .map((t) => ({
      timestamp: t.timestamp,
      value: t.temperature as number,
    }));

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/machines" className="hover:text-slate-900">
              Machines
            </Link>
            <span>/</span>
            <span className="text-slate-900">{machine.name}</span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {machine.name}
              </h1>
              <p className="text-slate-500 font-mono mt-1">{machine.id}</p>
            </div>
            <StatusBadge status={machine.status} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "telemetry", label: "Telemetry" },
              { id: "rules", label: "Configure Rules" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "overview" | "telemetry" | "rules")
                }
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ---------------- OVERVIEW ---------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Machine Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="text-sm font-medium mt-1">
                      {machine.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">ID</p>
                    <p className="text-sm font-mono mt-1">
                      {machine.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="text-sm font-medium mt-1 capitalize">
                      {machine.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Location</p>
                    <p className="text-sm font-medium mt-1">
                      {machine.location || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(power !== undefined ||
              voltage !== undefined ||
              temperature !== undefined) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {power !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Power</p>
                      <p className="text-2xl font-bold mt-1">
                        {typeof power === "number" ? power.toFixed(2) : "—"} W
                      </p>
                    </CardContent>
                  </Card>
                )}

                {voltage !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Voltage</p>
                      <p className="text-2xl font-bold mt-1">
                        {typeof voltage === "number"
                          ? voltage.toFixed(1)
                          : "—"}{" "}
                        V
                      </p>
                    </CardContent>
                  </Card>
                )}

                {temperature !== undefined && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-500">Temperature</p>
                      <p className="text-2xl font-bold mt-1">
                        {typeof temperature === "number"
                          ? temperature.toFixed(1)
                          : "—"}{" "}
                        °C
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {telemetry.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {powerData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Power Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeSeriesChart
                        data={powerData}
                        color="#2563eb"
                        unit=" W"
                      />
                    </CardContent>
                  </Card>
                )}

                {voltageData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Voltage Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeSeriesChart
                        data={voltageData}
                        color="#d97706"
                        unit=" V"
                      />
                    </CardContent>
                  </Card>
                )}

                {temperatureData.length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Temperature Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeSeriesChart
                        data={temperatureData}
                        color="#dc2626"
                        unit=" °C"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TELEMETRY ---------------- */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            {telemetry.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500">
                    No telemetry data available
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Telemetry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs">
                            Power
                          </th>
                          <th className="px-6 py-3 text-left text-xs">
                            Voltage
                          </th>
                          <th className="px-6 py-3 text-left text-xs">
                            Temp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y">
                        {telemetry
                          .slice(-10)
                          .reverse()
                          .map((point, i) => (
                            <tr key={i}>
                              <td className="px-6 py-3 text-sm">
                                {new Date(
                                  point.timestamp
                                ).toLocaleString()}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {typeof point.power === "number"
                                  ? point.power.toFixed(2)
                                  : "—"}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {typeof point.voltage === "number"
                                  ? point.voltage.toFixed(1)
                                  : "—"}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {typeof point.temperature === "number"
                                  ? point.temperature.toFixed(1)
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ---------------- RULES ---------------- */}
        {activeTab === "rules" && (
          <MachineRulesView deviceId={deviceId} />
        )}
      </div>
    </div>
  );
}