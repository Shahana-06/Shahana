'use server';

/**
 * @fileOverview Detects performance anomalies by correlating SDK metrics with user performance data.
 *
 * - detectPerformanceAnomaly - A function that detects performance anomalies.
 * - PerformanceAnomalyInput - The input type for the detectPerformanceAnomaly function.
 * - PerformanceAnomalyOutput - The return type for the detectPerformanceAnomaly function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformanceAnomalyInputSchema = z.object({
  sdkMetrics: z.string().describe('SDK metrics data in JSON format.'),
  userPerformanceData: z.string().describe('User performance data in JSON format.'),
});
export type PerformanceAnomalyInput = z.infer<typeof PerformanceAnomalyInputSchema>;

const PerformanceAnomalyOutputSchema = z.object({
  hasAnomaly: z.boolean().describe('Whether a performance anomaly is detected.'),
  anomalyDescription: z.string().describe('Description of the detected anomaly.'),
  suggestedActions: z.string().describe('Suggested actions to address the anomaly.'),
  recommendations: z.string().describe('General recommendations for system improvement based on the data.'),
  patternCategory: z
    .enum(['Latency', 'ErrorRate', 'Throughput', 'Availability', 'Multiple', 'None'])
    .describe('The category of the detected performance pattern.'),
  patternAnalysis: z.string().describe('A detailed analysis of the detected pattern and its likely causes.'),
});
export type PerformanceAnomalyOutput = z.infer<typeof PerformanceAnomalyOutputSchema>;

export async function detectPerformanceAnomaly(
  input: PerformanceAnomalyInput
): Promise<PerformanceAnomalyOutput> {
  return detectPerformanceAnomalyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'performanceAnomalyPrompt',
  input: {schema: PerformanceAnomalyInputSchema},
  output: {schema: PerformanceAnomalyOutputSchema},
  prompt: `You are an expert in performance monitoring and anomaly detection. Your task is to analyze SDK metrics and user performance data to identify anomalies, categorize them, and provide actionable insights.

Analyze the provided data based on the following metric classification and likely causes. Correlate the SDK metrics with the historical user performance data to detect patterns.

**Metric Classification & Likely Causes:**

**1. Latency / Response Time (Performance, ms):**
  - **Good:** <= 200ms
  - **Warning:** 201ms - 500ms
  - **Critical:** > 500ms
  - **Potential Causes:**
    - Network-related (e.g., high network latency, packet loss)
    - Server-side processing (e.g., heavy DB queries, unoptimized code, CPU/memory bottleneck)
    - Client-side processing (less common for API monitoring, but possible)
    - Application architecture (e.g., inefficient microservices communication)
    - Third-party services / APIs (e.g., slow responses from external dependencies)
    - Resource bottlenecks (e.g., insufficient server capacity)
    - Traffic spikes / Load (e.g., sudden increase in requests)
    - Caching issues (e.g., cache misses, ineffective caching strategy)
    - Content size / payload (e.g., large response bodies)
    - Configuration / deployment (e.g., misconfigured server, suboptimal deployment)

**2. Error Rate / Failure Rate (Reliability, %):**
  - **Good:** <= 1%
  - **Warning:** 1.01% - 5%
  - **Critical:** > 5%
  - **Potential Causes:**
    - Server-side errors (5xx) (e.g., application crashes, unhandled exceptions)
    - Client-side errors (4xx) (e.g., bad requests, authorization failures)
    - Database / Storage (e.g., connection failures, query errors)
    - Network issues (e.g., connectivity problems between services)
    - Third-party dependencies (e.g., downtime or errors from external APIs)
    - Load / traffic spikes (e.g., system overload causing failures)
    - Configuration / deployment issues (e.g., incorrect environment variables, bad deployment)
    - Code bugs / logical errors (e.g., flaws in the application logic)

**3. Throughput / RPS (Capacity, req/s):**
  - **Definition:** Number of requests the system can handle per second.
  - **Critical:** Significant drop from baseline or exceeding capacity.
  - **Potential Causes:**
    - Server resource limitations (CPU, memory, I/O)
    - Database / storage bottlenecks (e.g., slow queries under load)
    - Network limitations (e.g., bandwidth saturation)
    - Application architecture (e.g., blocking operations, inefficient algorithms)
    - Load / traffic spikes (e.g., overwhelming the system)
    - Caching / CDN issues (e.g., low cache hit ratio)
    - Third-party services (e.g., rate limiting or slow responses from dependencies)
    - Configuration / deployment (e.g., insufficient number of server instances)

**4. Availability / Uptime (Health, %):**
  - **Good:** >= 99.9%
  - **Warning:** 99% - 99.89%
  - **Critical:** < 99% (or status is DOWN)
  - **Potential Causes:**
    - Server failures (e.g., hardware issues, OS crashes)
    - Network outages (e.g., DNS problems, router failures)
    - Database / storage failures (e.g., storage system is down)
    - Application bugs (e.g., critical bug causing the application to be unresponsive)
    - Load / traffic spikes (e.g., DDoS attack or unexpected high traffic)
    - Third-party service downtime (e.g., critical dependency is offline)
    - Deployment / configuration issues (e.g., a bad deployment brings the system down)
    - Scheduled maintenance (if not handled with zero-downtime practices)

**Input Data:**
SDK Metrics:
{{sdkMetrics}}

User Performance Data (History):
{{userPerformanceData}}

**Your Analysis Steps:**
1.  **Detect Anomaly:** Determine if there's a significant performance anomaly by comparing the current metrics against the classification table and historical trends. Set \`hasAnomaly\` to true or false.
2.  **Describe Anomaly:** If an anomaly exists, provide a concise \`anomalyDescription\`. If not, state that performance is stable.
3.  **Suggest Actions:** Provide clear, actionable \`suggestedActions\` to resolve the anomaly. If none, suggest proactive measures.
4.  **Categorize Pattern:** Identify the primary metric category of the anomaly ('Latency', 'ErrorRate', 'Throughput', 'Availability'). If multiple categories are affected, use 'Multiple'. If no anomaly, use 'None'. Set this in \`patternCategory\`.
5.  **Analyze Pattern:** In \`patternAnalysis\`, provide a detailed explanation of the detected pattern, referencing the likely causes from the lists above and correlating it with the provided data.
6.  **Provide Recommendations:** Offer 2-3 actionable \`recommendations\` for overall system improvement, even if no major anomaly is detected.`,
});

const detectPerformanceAnomalyFlow = ai.defineFlow(
  {
    name: 'detectPerformanceAnomalyFlow',
    inputSchema: PerformanceAnomalyInputSchema,
    outputSchema: PerformanceAnomalyOutputSchema,
  },
  async input => {
    try {
      // Parse the input data to ensure it's valid JSON.
      JSON.parse(input.sdkMetrics);
      JSON.parse(input.userPerformanceData);
    } catch (e: any) {
      console.error('Error parsing JSON data:', e.message);
      return {
        hasAnomaly: true,
        anomalyDescription: `Invalid JSON format in input data: ${e.message}`,
        suggestedActions: 'Check the format of the SDK metrics and user performance data.',
        recommendations: 'Unable to provide recommendations due to data format error.',
        patternCategory: 'None',
        patternAnalysis: 'Could not perform analysis due to input data error.',
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
