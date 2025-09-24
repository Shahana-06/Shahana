'use server';

/**
 * @fileOverview Generates a comprehensive website report by analyzing a given URL.
 *
 * - generateWebsiteReport - A function that analyzes a website and provides a detailed report.
 * - GenerateWebsiteReportInput - The input type for the generateWebsiteReport function.
 * - GenerateWebsiteReportOutput - The return type for the generateWebsiteReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPageSpeedInsights } from '@/app/services/get-pagespeed-insights';
import type { PerformanceMetrics } from '@/app/services/get-pagespeed-insights';


const GenerateWebsiteReportInputSchema = z.object({
  websiteUrl: z.string().url().describe('The URL of the website to analyze.'),
});

export type GenerateWebsiteReportInput = z.infer<typeof GenerateWebsiteReportInputSchema>;

const TrafficDataSchema = z.array(z.object({
  month: z.string(),
  visitors: z.number(),
}));

const ErrorBreakdownSchema = z.array(z.object({
  type: z.string(),
  count: z.number(),
}));

const GenerateWebsiteReportOutputSchema = z.object({
  trafficPrediction: z.string().describe('Predicted website traffic analysis.'),
  apiHealth: z.string().describe('Assessment of the website\'s API health.'),
  criticalErrors: z.string().describe('Summary of critical errors found.'),
  recommendations: z.string().describe('A high-level summary of all actionable recommendations for improvement.'),
  weakSpotAnalysis: z.string().describe('A detailed analysis of the top 3-4 most critical weak spots, with specific recommendations for each. Format this as a markdown list.'),
  serverSideProblems: z.string().describe('Analysis of potential server-side problems.'),
  serverLoad: z.string().describe('Evaluation of the server load.'),
  serverThreshold: z.number().describe('The critical threshold point for server load as a percentage.'),
  performanceMetrics: z.object({
      loadTime: z.number().describe('Page load time in seconds.'),
      firstContentfulPaint: z.number().describe('First Contentful Paint (FCP) in seconds.'),
      timeToInteractive: z.number().describe('Time to Interactive (TTI) in seconds.'),
  }).describe('Key performance metrics with numeric values.'),
  trafficData: TrafficDataSchema.describe('Monthly visitor data for the last 6 months to be displayed in a chart.'),
  errorBreakdown: ErrorBreakdownSchema.describe('A breakdown of error types and their counts.'),
});

export type GenerateWebsiteReportOutput = z.infer<typeof GenerateWebsiteReportOutputSchema>;

export async function generateWebsiteReport(
  input: GenerateWebsiteReportInput
): Promise<GenerateWebsiteReportOutput> {
  return generateWebsiteReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWebsiteReportPrompt',
  input: {schema: z.object({ 
    websiteUrl: z.string().url(),
    performanceMetrics: z.object({
        loadTime: z.number(),
        firstContentfulPaint: z.number(),
        timeToInteractive: z.number(),
    }),
  })},
  output: {schema: GenerateWebsiteReportOutputSchema},
  prompt: `You are an expert web analyst and performance engineer.
Your task is to generate a comprehensive report for the given website URL: {{{websiteUrl}}}

You have been provided with real performance metrics from Google's PageSpeed Insights:
- Page Load Time (Speed Index): {{{performanceMetrics.loadTime}}}s
- First Contentful Paint: {{{performanceMetrics.firstContentfulPaint}}}s
- Time to Interactive: {{{performanceMetrics.timeToInteractive}}}s

Based on these real metrics, generate a realistic but simulated, data-driven report.
The report should include:
- Simulated traffic data for the last 6 months to be displayed in a chart.
- A breakdown of simulated error types and their counts.
- A plausible critical server load threshold as a percentage (e.g., between 75 and 95).

Then, based on ALL the data (both real and simulated), provide a detailed qualitative analysis for the following sections:
- trafficPrediction: Analyze the traffic data you generated and predict future trends.
- apiHealth: Assess the potential performance and reliability of the website's APIs based on the error breakdown and performance metrics.
- criticalErrors: Summarize the critical errors identified in the error breakdown.
- recommendations: Provide a high-level summary of all actionable recommendations.
- weakSpotAnalysis: Identify the top 3-4 most critical weak spots based on all available data. For each weak spot, provide a clear explanation of the problem and actionable recommendations to fix it. Format this as a markdown list.
- serverSideProblems: Investigate potential issues on the server, such as slow database queries or inefficient code, based on the metrics.
- serverLoad: Evaluate the current server load and its capacity to handle traffic.
`,
});

const generateWebsiteReportFlow = ai.defineFlow(
  {
    name: 'generateWebsiteReportFlow',
    inputSchema: GenerateWebsiteReportInputSchema,
    outputSchema: GenerateWebsiteReportOutputSchema,
  },
  async input => {
    // Fetch real performance data
    const performanceMetrics = await getPageSpeedInsights(input.websiteUrl);

    // Call the AI with both the URL and the real data
    const { output } = await prompt({
        websiteUrl: input.websiteUrl,
        performanceMetrics,
    });
    
    // The prompt output already includes performanceMetrics, so we just return it.
    return output!;
  }
);
