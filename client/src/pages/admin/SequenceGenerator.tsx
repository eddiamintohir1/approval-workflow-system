import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, RefreshCw, Plus } from "lucide-react";

type SequenceType = "MAF" | "PR" | "CATTO" | "SKU" | "PAF";

export default function SequenceGenerator() {
  const [activeTab, setActiveTab] = useState<SequenceType>("MAF");
  
  const { data: allSequences, refetch } = trpc.sequences.getAll.useQuery();
  const generateSequence = trpc.sequences.generate.useMutation();
  const resetCounter = trpc.sequences.reset.useMutation();
  
  const sequences = allSequences?.filter(s => s.sequenceType === activeTab) || [];
  
  const handleGenerate = async () => {
    try {
      const result = await generateSequence.mutateAsync({ type: activeTab });
      toast.success("Sequence Generated", {
        description: `New ${activeTab} sequence: ${result.sequenceNumber}`,
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate sequence");
    }
  };
  
  const handleReset = async (date: string) => {
    if (!confirm(`Are you sure you want to reset the ${activeTab} counter for ${date}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await resetCounter.mutateAsync({ type: activeTab, date });
      toast.success("Counter Reset", {
        description: `${activeTab} counter for ${date} has been reset to 0`,
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset counter");
    }
  };
  
  const exportToCSV = () => {
    if (sequences.length === 0) {
      toast.error("No sequences to export");
      return;
    }
    
    const headers = ["Date", "Type", "Current Counter", "Created At"];
    const rows = sequences.map(s => [
      s.sequenceDate,
      s.sequenceType,
      s.currentCounter.toString(),
      new Date(s.createdAt).toLocaleString(),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_sequences_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Export Successful", {
      description: `${sequences.length} sequences exported to CSV`,
    });
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sequence Generators</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage sequence numbers for MAF, PR, CATTO, SKU, and PAF
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SequenceType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="MAF">MAF</TabsTrigger>
          <TabsTrigger value="PR">PR</TabsTrigger>
          <TabsTrigger value="CATTO">CATTO</TabsTrigger>
          <TabsTrigger value="SKU">SKU</TabsTrigger>
          <TabsTrigger value="PAF">PAF</TabsTrigger>
        </TabsList>
        
        {(["MAF", "PR", "CATTO", "SKU", "PAF"] as SequenceType[]).map(type => (
          <TabsContent key={type} value={type} className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{type} Sequence Generator</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Format: WFMT-{type}-YYMMDD-XXX
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={generateSequence.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Current Counter</TableHead>
                      <TableHead>Last Generated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No sequences generated yet. Click "Generate New" to create the first sequence.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sequences.map((seq) => (
                        <TableRow key={seq.id}>
                          <TableCell className="font-medium">
                            {seq.sequenceDate}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {seq.currentCounter.toString().padStart(3, "0")}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(seq.updatedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReset(seq.sequenceDate)}
                              disabled={resetCounter.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Sequence Rules</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sequences reset automatically each day</li>
                  <li>• Format: WFMT-{type}-YYMMDD-XXX (e.g., WFMT-MAF-260220-001)</li>
                  <li>• Counters start from 001 and increment sequentially</li>
                  <li>• Admin can manually reset counters if needed</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
