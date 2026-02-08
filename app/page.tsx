import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Car, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { Database } from "@/db-types";
import { PropertyCard } from "@/components/PropertyCard";

type Property = Database['public']['Tables']['properties']['Row'] & {
  parking_units: { id: string, name: string }[]
};

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("properties").select("*, parking_units(id, name)");
  // @ts-ignore
  const properties = data as Property[] | null;

  return (
    <main className="min-h-screen bg-concrete-grey font-sans text-matte-black flex flex-col">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-matte-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/cashphalt-logo.svg"
                alt="Cashphalt Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Cashphalt</span>
          </Link>
          <Link
            href="/admin"
            className="text-sm font-bold text-gray-300 hover:text-signal-yellow transition-colors"
          >
            LOG IN
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-matte-black text-white pt-32 pb-24 px-6 relative overflow-hidden">
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
      <section className="max-w-5xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <MapPin className="text-matte-black fill-signal-yellow" size={32} />
            AVAILABLE PROPERTIES
          </h2>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-outline shadow-sm">
            <Car className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-matte-black mb-2">No Properties Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Please run the seed script to initialize the parking zones.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                units={property.parking_units || []}
              />
            ))}
          </div>

        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-outline py-12 text-center bg-white">
        <div className="inline-block relative w-10 h-10 mb-4 opacity-20 grayscale">
          <Image
            src="/cashphalt-logo.svg"
            alt="Cashphalt Logo"
            fill
            className="object-contain"
          />
        </div>
        <p className="font-medium text-gray-400 text-sm">© {new Date().getFullYear()} Cashphalt. Infrastructure Optimized.</p>
      </footer>
    </main>
  );
}
