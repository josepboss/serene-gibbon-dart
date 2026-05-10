import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Server, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            G2G ↔ SMMCost Bridge
          </h1>
          <p className="text-xl text-slate-500">
            Automated order fulfillment between G2G marketplace and SMMCost SMM panel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Admin Dashboard
              </CardTitle>
              <CardDescription>
                Manage service mappings and monitor order status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin">
                <Button className="w-full">
                  Open Admin
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-green-500" />
                API Endpoints
              </CardTitle>
              <CardDescription>
                Available server endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <code className="text-blue-600">POST /webhook/g2g</code>
                <span className="text-slate-500">G2G webhooks</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <code className="text-blue-600">GET /health</code>
                <span className="text-slate-500">Server status</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <code className="text-blue-600">GET /pending</code>
                <span className="text-slate-500">Pending orders</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>Configure via <code className="bg-slate-100 px-2 py-1 rounded">.env</code> and <code className="bg-slate-100 px-2 py-1 rounded">service-map.json</code></p>
        </div>
      </div>
    </div>
  );
};

export default Index;