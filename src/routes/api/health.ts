import { createFileRoute } from "@tanstack/react-router";

import { getBackendHealth } from "@/lib/health-status.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const health = getBackendHealth();

        return Response.json(health, {
          status: health.ready ? 200 : 503,
          headers: {
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
