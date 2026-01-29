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
    <main className="min-h-screen bg-concrete-grey font-sans text-matte-black">
      {/* Hero Section */}
      <section className="bg-matte-black text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-signal-yellow text-sm font-bold border border-signal-yellow/20 tracking-wide uppercase">
            <ShieldCheck size={16} />
            <span>Secure & Instant Parking</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            PARKING MADE <span className="text-signal-yellow">EFFICIENT</span>.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            Scan, pay, and park in seconds. No apps needed.
          </p>
        </div>
        {/* Abstract "Road" or texture could go here */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-signal-yellow/50"></div>
      </section>

      {/* Properties List */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="text-matte-black fill-signal-yellow" size={32} />
            AVAILABLE ZONES
          </h2>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-outline shadow-sm">
            <Car className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-matte-black mb-2">No Properties Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Please run the seed script to initialize the parking zones.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                href={`/pay/${property.slug}`}
                key={property.id}
                className="group bg-white rounded-xl border border-slate-outline p-6 shadow-sm hover:shadow-lg hover:border-matte-black transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-signal-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="pl-2">
                  <div className="flex items-start justify-between mb-5">
                    <div className="bg-concrete-grey text-matte-black p-3 rounded-lg group-hover:bg-signal-yellow transition-colors">
                      <Car size={24} strokeWidth={2.5} />
                    </div>
                    {property.allocation_mode === 'ZONE' && (
                      <span className="bg-matte-black text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                        Zone
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-matte-black mb-2 group-hover:underline decoration-signal-yellow decoration-4 underline-offset-4">
                    {property.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <span className="inline-block w-2 h-2 bg-success-green rounded-full animate-pulse"></span>
                    Open 24/7 • Max {property.max_booking_duration_hours}h
                  </div>
                </div>

                <div className="mt-8 pl-2 flex items-center text-sm font-bold text-matte-black gap-2 group-hover:gap-3 transition-all">
                  START SESSION <ArrowRight size={18} className="text-signal-yellow" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-outline py-12 text-center text-gray-500 text-sm bg-white">
        <p className="font-medium">© {new Date().getFullYear()} Cashphalt. Infrastructure Optimized.</p>
      </footer>
    </main>
  );
}

