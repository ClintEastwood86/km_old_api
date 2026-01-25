import client from 'prom-client';

client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status']
});

export const httpRequestDuration = new client.Histogram({
	name: 'http_request_duration_ms',
	help: 'HTTP request duration in ms',
	labelNames: ['method', 'route', 'status'],
	buckets: [50, 100, 200, 300, 500, 800, 1000, 2000]
});

export const prismaQueryDuration = new client.Histogram({
	name: 'prisma_query_duration_seconds',
	help: 'Prisma query duration',
	buckets: [0.05, 0.1, 0.3, 0.5, 1, 2]
});

export const metricsHandler = (): Promise<string> => {
	return client.register.metrics();
};
