'use server';

import { generateWebsiteReport, type GenerateWebsiteReportInput } from '@/ai/flows/generate-website-report';
import { analyzeWebsiteActivity, type AnalyzeWebsiteActivityInput } from '@/ai/flows/analyze-website-activity';

export async function getWebsiteReport(input: GenerateWebsiteReportInput) {
  try {
    const result = await generateWebsiteReport(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in getWebsiteReport:', error);
    return { success: false, error: 'Failed to generate website report. Please try again.' };
  }
}

export async function getWebsiteActivity(input: AnalyzeWebsiteActivityInput) {
  try {
    const result = await analyzeWebsiteActivity(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in getWebsiteActivity:', error);
    return { success: false, error: 'Failed to analyze website activity. Please try again.' };
  }
}
