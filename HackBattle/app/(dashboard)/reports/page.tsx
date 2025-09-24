"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart, HeartPulse, AlertTriangle, Server, ShieldCheck, Loader2, Clock, Gauge, ArrowRight, Target } from "lucide-react";
import Link from 'next/link';

import { getWebsiteReport } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GenerateWebsiteReportOutput } from "@/ai/flows/generate-website-report";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  websiteUrl: z.string().url({ message: "Please enter a valid URL." }),
});

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ReportsPage() {
  const [report, setReport] = useState<GenerateWebsiteReportOutput | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { websiteUrl: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setReport(null);
    setSubmittedUrl(values.websiteUrl);
    const result = await getWebsiteReport(values);
    if (result.success) {
      setReport(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: result.error,
      });
      setSubmittedUrl(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website Analysis Report</h1>
        <p className="text-muted-foreground">Generate a comprehensive, data-driven report by analyzing a website URL.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Website URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Report
                </Button>
              </div>
            </form>
          </Form>

          {(isSubmitting || report) && <Separator className="my-6" />}

          {isSubmitting && (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Analyzing website... this may take a few moments.</p>
            </div>
          )}

          {report && submittedUrl && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold">Analysis for: <span className="text-primary">{submittedUrl}</span></h2>
                  <Link href={`/activity?websiteUrl=${encodeURIComponent(submittedUrl)}`}>
                      <Button variant="outline">
                          View Activity Log <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  </Link>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="server">Server Health</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> General Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap font-sans">{report.recommendations}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Weak Spots &amp; Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="text-sm whitespace-pre-wrap font-sans prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: report.weakSpotAnalysis.replace(/\n/g, '<br />') }} />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="performance" className="mt-4 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Load Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{report.performanceMetrics.loadTime}s</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{report.performanceMetrics.firstContentfulPaint}s</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time to Interactive</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{report.performanceMetrics.timeToInteractive}s</div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" /> Monthly Traffic Analysis</CardTitle>
                      <CardDescription>{report.trafficPrediction}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={report.trafficData}>
                          <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`}/>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                          <Legend wrapperStyle={{ fontSize: "12px" }}/>
                          <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="server" className="mt-4 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                     <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /> Error Breakdown</CardTitle>
                        <CardDescription>{report.criticalErrors}</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={report.errorBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                              {report.errorBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                            <Legend wrapperStyle={{ fontSize: "12px" }}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" /> API Health</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap font-sans">{report.apiHealth}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Server-Side Analysis</CardTitle>
                           <CardDescription>{report.serverSideProblems}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                         <p className="text-sm whitespace-pre-wrap font-sans">{report.serverLoad}</p>
                         <div>
                           <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Critical Threshold</span>
                              <span className="text-sm font-bold text-destructive">{report.serverThreshold}%</span>
                           </div>
                           <Progress value={report.serverThreshold} className="h-2 [&gt;div]:bg-destructive" />
                           <p className="text-xs text-muted-foreground mt-1">The server load should not exceed this point to maintain stability.</p>
                         </div>
                      </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
