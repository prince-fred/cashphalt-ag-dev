import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Car, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { Database } from "@/database.types";

type Property = Database['public']['Tables']['properties']['Row'];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("*");
  const properties = data as Property[] | null;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium border border-indigo-500/30 mb-4">
            <ShieldCheck size={14} />
            <span>Secure & Instant Parking</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Parking Made <span className="text-indigo-400">Simple</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Scan, pay, and park in seconds. No apps needs, no accounts required.
          </p>
        </div>
      </section>

      {/* Properties List */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="text-indigo-600" />
            Available Locations
          </h2>
          {/* In a real app, search/filter would go here */}
        </div>

        {!properties || properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <Car className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
            <p className="text-slate-500">Please run the seed script to add test locations.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                href={`/pay/${property.slug}`}
                key={property.id}
                className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <Car size={24} />
                    </div>
                    {property.allocation_mode === 'ZONE' && (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        Zone
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {property.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    Open 24/7 • Max {property.max_booking_duration_hours}h
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 gap-1 group-hover:gap-2 transition-all">
                  Pay Now <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 text-center text-slate-400 text-sm bg-white">
        <p>© {new Date().getFullYear()} Cashphalt. All rights reserved.</p>
      </footer>
    </main>
  );
}

