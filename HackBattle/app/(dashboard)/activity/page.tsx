'use client';

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { analyzeWebsiteActivity } from "@/ai/flows/analyze-website-activity";
import { Loader2, Zap, KeyRound, Activity as ActivityIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Activity = {
  user: string;
  email: string;
  action: string;
  status: string;
  timestamp: string;
};

type Analysis = {
  keyPatterns: string;
  successFailureAnalysis: string;
  securityFlags: string;
};

export default function ActivityPage() {
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const websiteUrl = searchParams.get('websiteUrl');

  useEffect(() => {
    async function getAnalysis() {
      if (!websiteUrl) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const result = await analyzeWebsiteActivity({ websiteUrl });
        setAnalysis(result.analysis);
        setActivities(result.activities);
      } catch (error) {
        console.error('Error analyzing activity:', error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "Could not analyze website activities.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    getAnalysis();
  }, [websiteUrl, toast]);

  if (!websiteUrl) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-full">
         <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
            <p className="text-muted-foreground mt-2">
              To see activity, first analyze a website on the Reports page.
            </p>
            <Link href="/reports" className="mt-4 inline-block">
                <Badge>Go to Reports</Badge>
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">An AI-generated audit trail for <span className="font-semibold text-primary">{websiteUrl}</span>.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><ActivityIcon className="h-5 w-5 text-primary" /> Key Patterns</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Analyzing...</p>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap font-sans">{analysis?.keyPatterns}</p>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Zap className="h-5 w-5 text-primary" /> Success vs. Failure</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Analyzing...</p>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap font-sans">{analysis?.successFailureAnalysis}</p>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5 text-primary" /> Security Flags</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm">Analyzing...</p>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap font-sans">{analysis?.securityFlags}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulated Recent Activities</CardTitle>
          <CardDescription>
            Showing the last {activities.length} plausible activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{log.user}</div>
                      <div className="text-sm text-muted-foreground">{log.email}</div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={log.status === "Success" ? "secondary" : "destructive"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{log.timestamp}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
