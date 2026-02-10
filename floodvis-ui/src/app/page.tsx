import Link from "next/link";
import AppShell from "../components/AppShell";
import UserGreeting from "../components/UserGreeting";

export default function Home() {
  return (
    <AppShell>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <header className="mb-2 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight text-slate-800">
            FloodVis
          </div>
          <Link
            href="/profile"
            className="inline-flex h-8 items-center justify-center rounded-full bg-white px-4 text-xs font-medium text-slate-700 shadow-sm"
          >
            Profile
          </Link>
        </header>

        <section className="space-y-2">
          <UserGreeting />
          <p className="text-xs text-slate-500">
            Choose a section to manage your safety during floods.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <HomeCard
            href="/dashboard"
            title="Flood Risk Visualization"
            description="See current risk score, map, and weather metrics."
          />
          <HomeCard
            href="/family"
            title="Family Connection"
            description="View your safety circle and their risk status."
          />
          <HomeCard
            href="/emergency"
            title="SOS & Emergency Contacts"
            description="Send SOS alert and manage who gets notified."
          />
          <HomeCard
            href="/guardians"
            title="Guardian Details"
            description="Add or edit family guardian contact details."
          />
           <HomeCard
            href="/profile"
            title="Profile"
            description="View your profile and settings."
          />
        </section>
      </main>
    </AppShell>
  );
}

type HomeCardProps = {
  href: string;
  title: string;
  description: string;
};

function HomeCard({ href, title, description }: HomeCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-3xl bg-white p-4 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      <span className="mt-3 text-[11px] font-semibold text-sky-600">
        Open →
      </span>
    </Link>
  );
}
