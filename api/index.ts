import type { VercelRequest, VercelResponse } from "@vercel/node";

import app from "../backend/src/app";

const PATH_QUERY_KEY = "__path";

function normalizePathParam(value: unknown): string | null {
	if (typeof value === "string") return value;
	if (Array.isArray(value) && typeof value[0] === "string") return value[0];
	return null;
}

function buildQueryString(query: VercelRequest["query"]): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(query ?? {})) {
		if (key === PATH_QUERY_KEY) continue;
		if (typeof value === "string") {
			params.set(key, value);
			continue;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === "string") params.append(key, item);
			}
		}
	}

	const qs = params.toString();
	return qs.length ? `?${qs}` : "";
}

export default function handler(req: VercelRequest, res: VercelResponse) {
	const rewrittenPath = normalizePathParam(req.query?.[PATH_QUERY_KEY]);

	if (rewrittenPath) {
		const suffix = rewrittenPath.startsWith("/") ? rewrittenPath : `/${rewrittenPath}`;
		const nextUrl = `/api${suffix}${buildQueryString(req.query)}`;
		req.url = nextUrl;
	} else if (req.url === "/api" || req.url === "/api/") {
		req.url = "/api/health";
	}

	return app(req as any, res as any);
}
