import { useEffect, useState } from "react";
import { API_BASE_URL } from "./lib/api.js";

export default function App() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    // health lives at the API root, not under /api/v1
    const healthUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/health";
    fetch(healthUrl)
      .then((r) => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Gold Loan Portal</h1>
          <nav className="flex gap-4 text-sm">
            <a className="hover:underline" href="#/">Apply</a>
            <a className="hover:underline" href="#/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-gray-600">
          Scaffold ready. API health:{" "}
          <span className={apiOk ? "text-green-600" : apiOk === false ? "text-red-600" : "text-gray-400"}>
            {apiOk === null ? "checking…" : apiOk ? "ok" : "unreachable"}
          </span>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Next phases add the 3-step apply flow, the AI chat panel, and the admin table.
        </p>
      </main>
    </div>
  );
}
