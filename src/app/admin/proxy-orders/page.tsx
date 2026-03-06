import { getOrders } from "@/lib/orders-db";
import { AdminOrdersClient } from "./AdminOrdersClient";
import { Navbar } from "@/components/Navbar";

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = (await getOrders()).reverse(); // Show newest first

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      <Navbar />
      
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin: Proxy Orders</h1>
        </div>
        
        <AdminOrdersClient initialOrders={orders} />
      </main>
    </div>
  );
}
