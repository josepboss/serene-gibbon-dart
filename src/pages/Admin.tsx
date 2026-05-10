"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, RefreshCw, Server, Link2, AlertCircle, CheckCircle } from "lucide-react";

interface ServiceMapping {
  g2gOfferId: string;
  smmServiceId: string;
  description?: string;
}

interface PendingOrder {
  smmOrderId: string;
  g2gOrderId: string;
  g2gDeliveryId: string;
  offerId: string;
  qty: number;
  link: string;
  status: string;
  smmStatus: string;
  createdAt: string;
  lastChecked: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  pendingOrders: number;
  uptime: number;
}

export default function Admin() {
  const [mappings, setMappings] = useState<ServiceMapping[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [newMapping, setNewMapping] = useState({ g2gOfferId: "", smmServiceId: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"mappings" | "orders" | "health">("mappings");

  // Load mappings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("service-mappings");
    if (saved) {
      setMappings(JSON.parse(saved));
    } else {
      // Default mappings
      setMappings([
        { g2gOfferId: "OFFER_001", smmServiceId: "1001", description: "Instagram Followers" },
        { g2gOfferId: "OFFER_002", smmServiceId: "1002", description: "Instagram Likes" },
        { g2gOfferId: "OFFER_003", smmServiceId: "1003", description: "TikTok Views" },
      ]);
    }
  }, []);

  // Save mappings to localStorage
  useEffect(() => {
    localStorage.setItem("service-mappings", JSON.stringify(mappings));
  }, [mappings]);

  // Fetch health and pending orders
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const healthRes = await fetch("/health");
      const healthData = await healthRes.json();
      setHealth(healthData);

      const pendingRes = await fetch("/pending");
      const pendingData = await pendingRes.json();
      setPendingOrders(pendingData.orders || []);
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const addMapping = () => {
    if (!newMapping.g2gOfferId || !newMapping.smmServiceId) return;
    setMappings([...mappings, { ...newMapping }]);
    setNewMapping({ g2gOfferId: "", smmServiceId: "", description: "" });
  };

  const deleteMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const exportMappings = () => {
    const exportData: Record<string, string> = {};
    mappings.forEach((m) => {
      exportData[m.g2gOfferId] = m.smmServiceId;
    });
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-map.json";
    a.click();
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Server className="w-8 h-8" />
            G2G ↔ SMMCost Bridge Admin
          </h1>
          <p className="text-slate-500 mt-2">Manage service mappings and monitor order status</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "mappings" ? "default" : "outline"}
            onClick={() => setActiveTab("mappings")}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Service Mappings
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Pending Orders
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "health" ? "default" : "outline"}
            onClick={() => setActiveTab("health")}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Health
          </Button>
        </div>

        {/* Service Mappings Tab */}
        {activeTab === "mappings" && (
          <div className="space-y-6">
            {/* Add New Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Mapping</CardTitle>
                <CardDescription>Map G2G offer IDs to SMMCost service IDs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  <Input
                    placeholder="G2G Offer ID (e.g., OFFER_001)"
                    value={newMapping.g2gOfferId}
                    onChange={(e) => setNewMapping({ ...newMapping, g2gOfferId: e.target.value })}
                    className="w-48"
                  />
                  <Input
                    placeholder="SMMCost Service ID (e.g., 1001)"
                    value={newMapping.smmServiceId}
                    onChange={(e) => setNewMapping({ ...newMapping, smmServiceId: e.target.value })}
                    className="w-48"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newMapping.description}
                    onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                    className="w-48"
                  />
                  <Button onClick={addMapping}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mappings Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Current Mappings</CardTitle>
                  <CardDescription>{mappings.length} mappings configured</CardDescription>
                </div>
                <Button variant="outline" onClick={exportMappings}>
                  Export JSON
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>G2G Offer ID</TableHead>
                      <TableHead>SMMCost Service ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                          No mappings configured. Add one above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      mappings.map((mapping, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{mapping.g2gOfferId}</TableCell>
                          <TableCell className="font-mono">{mapping.smmServiceId}</TableCell>
                          <TableCell>{mapping.description || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMapping(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Orders Tab */}
        {activeTab === "orders" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Orders currently being processed</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No pending orders</p>
                  <p className="text-sm">All orders have been processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SMMCost ID</TableHead>
                      <TableHead>G2G Order</TableHead>
                      <TableHead>Offer</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((order) => (
                      <TableRow key={order.smmOrderId}>
                        <TableCell className="font-mono">{order.smmOrderId}</TableCell>
                        <TableCell className="font-mono">{order.g2gOrderId}</TableCell>
                        <TableCell>{order.offerId}</TableCell>
                        <TableCell>{order.qty}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.smmStatus || "Pending"}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(order.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${health?.status === "ok" ? "text-green-500" : "text-red-500"}`} />
                  Server Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${health?.status === "ok" ? "text-green-600" : "text-red-600"}`}>
                  {health?.status === "ok" ? "Healthy" : "Error"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Last check: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{health?.pendingOrders || 0}</p>
                <p className="text-slate-500 text-sm mt-1">Orders in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-purple-500" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{health?.uptime ? formatUptime(health.uptime) : "N/A"}</p>
                <p className="text-slate-500 text-sm mt-1">Since last restart</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}