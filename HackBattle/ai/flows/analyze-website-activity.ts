'use server';

/**
 * @fileOverview Analyzes a list of user activities and provides a structured summary.
 *
 * - analyzeWebsiteActivity - A function that takes a website URL, generates plausible activities, and returns a structured analysis.
 * - AnalyzeWebsiteActivityInput - The input type for the analyzeWebsiteActivity function.
 * - AnalyzeWebsiteActivityOutput - The return type for the analyzeWebsiteActivity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ActivitySchema = z.object({
  user: z.string(),
  email: z.string().email(),
  action: z.string(),
  status: z.string(),
  timestamp: z.string(),
});

const AnalyzeWebsiteActivityInputSchema = z.object({
  websiteUrl: z.string().url().describe('The URL of the website to generate activities for.'),
});

export type AnalyzeWebsiteActivityInput = z.infer<typeof AnalyzeWebsiteActivityInputSchema>;

const AnalyzeWebsiteActivityOutputSchema = z.object({
  activities: z.array(ActivitySchema).describe('A list of 10 plausible recent user activities for the given website.'),
  analysis: z.object({
    keyPatterns: z.string().describe('A brief summary of the most important user behavior patterns observed.'),
    successFailureAnalysis: z.string().describe('An analysis of successful vs. failed actions, and what they might indicate.'),
    securityFlags: z.string().describe('Any potential security concerns or suspicious activities worth noting.'),
  }).describe('A structured analysis of the generated activities.')
});

export type AnalyzeWebsiteActivityOutput = z.infer<typeof AnalyzeWebsiteActivityOutputSchema>;

export async function analyzeWebsiteActivity(
  input: AnalyzeWebsiteActivityInput
): Promise<AnalyzeWebsiteActivityOutput> {
  return analyzeWebsiteActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWebsiteActivityPrompt',
  input: { schema: AnalyzeWebsiteActivityInputSchema },
  output: { schema: AnalyzeWebsiteActivityOutputSchema },
  prompt: `You are an expert security and user behavior analyst. Your task is to analyze the provided website URL and generate a realistic list of 10 recent user activities.

First, determine the purpose of the website at "{{websiteUrl}}" (e.g., e-commerce, blog, marketing, etc.).

Then, based on the website's purpose, generate a plausible list of 10 activities. These activities should be highly relevant to what a real user would do on this specific site and include a mix of successful and failed actions. For each activity, create a user, email, action, status (Success/Failed), and a recent timestamp.

After generating the list of activities, provide a structured analysis broken down into three parts:
1.  **keyPatterns**: A brief summary of the most important user behavior patterns observed.
2.  **successFailureAnalysis**: An analysis of successful vs. failed actions, and what they might indicate (e.g., checkout completions vs. payment failures).
3.  **securityFlags**: Any potential security concerns or suspicious activities worth noting (e.g., multiple failed login attempts from the same user).
  `,
});

const analyzeWebsiteActivityFlow = ai.defineFlow(
  {
    name: 'analyzeWebsiteActivityFlow',
    inputSchema: AnalyzeWebsiteActivityInputSchema,
    outputSchema: AnalyzeWebsiteActivityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
