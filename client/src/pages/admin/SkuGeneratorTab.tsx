import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, RefreshCw, Plus, Search, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SkuGeneratorTab() {
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Queries
  const { data: categories } = trpc.skuGenerator.getCategories.useQuery();
  const { data: searchResults, refetch: refetchSearch } =
    trpc.skuGenerator.searchSkus.useQuery(
      { query: searchQuery, limit: 50 },
      { enabled: searchQuery.length > 0 }
    );
  const { data: categorySkus, refetch: refetchCategorySkus } =
    trpc.skuGenerator.getSkusByCategory.useQuery(
      { categoryId: selectedCategory, limit: 100 },
      { enabled: !!selectedCategory }
    );

  // Mutations
  const generateSku = trpc.skuGenerator.generateSku.useMutation();
  const exportSkus = trpc.skuGenerator.exportSkus.useMutation();
  const getSkuDetails = trpc.skuGenerator.getSkuDetails.useMutation();

  const handleGenerate = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    try {
      const result = await generateSku.mutateAsync({
        categoryId: selectedCategory,
        productName: productName || undefined,
        description: description || undefined,
        userId: 1, // TODO: Get from auth context
      });

      toast.success("SKU Generated", {
        description: `New SKU: ${result.skuCode}`,
      });

      setProductName("");
      setDescription("");
      refetchCategorySkus();
    } catch (error: any) {
      toast.error("Failed to generate SKU", {
        description: error.message,
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await exportSkus.mutateAsync({
        categoryId: selectedCategory || undefined,
      });

      if (!data || data.length === 0) {
        toast.error("No SKUs to export");
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skus_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export Successful", {
        description: `${data.length} SKUs exported to CSV`,
      });
    } catch (error: any) {
      toast.error("Export failed", {
        description: error.message,
      });
    }
  };

  const handleViewDetails = async (skuId: string) => {
    try {
      const result = await getSkuDetails.mutateAsync({ skuId });
      setSelectedSku(result.sku);
      setShowDetails(true);
    } catch (error: any) {
      toast.error("Failed to load SKU details");
    }
  };

  const displaySkus = searchQuery
    ? searchResults?.data || []
    : categorySkus?.skus || [];

  return (
    <div className="space-y-6">
      {/* Generate Tab */}
      {activeTab === "generate" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Generate New SKU</h2>
              <p className="text-sm text-muted-foreground">
                Create a new SKU code for your product
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.prefix || "(No Prefix)"} - {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold">
                  Product Name (Optional)
                </label>
                <Input
                  placeholder="e.g., Pawmeals Perky Porky 500gr"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Add any additional details about this SKU"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateSku.isPending || !selectedCategory}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate SKU
            </Button>
          </div>
        </Card>
      )}

      {/* Search Tab */}
      {activeTab === "search" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Search SKUs</h2>
              <p className="text-sm text-muted-foreground">
                Find and view existing SKU codes
              </p>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by SKU code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => refetchSearch()}
                disabled={!searchQuery}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Results Table */}
            {displaySkus.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displaySkus.map((sku) => (
                      <TableRow key={sku.id}>
                        <TableCell className="font-mono font-semibold">
                          {sku.skuCode}
                        </TableCell>
                        <TableCell>{sku.productName || "-"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {sku.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sku.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(sku.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                No SKUs found matching "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter a search term to find SKUs
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Category View Tab */}
      {activeTab === "category" && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">View by Category</h2>
                <p className="text-sm text-muted-foreground">
                  Browse SKUs by product category
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={exportSkus.isPending || !selectedCategory}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                Select Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.prefix || "(No Prefix)"} - {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SKUs Table */}
            {categorySkus && categorySkus.data.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Sequence #</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categorySkus.data.map((sku) => (
                      <TableRow key={sku.id}>
                        <TableCell className="font-mono font-semibold">
                          {sku.skuCode}
                        </TableCell>
                        <TableCell>{sku.sequenceNumber}</TableCell>
                        <TableCell>{sku.productName || "-"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {sku.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sku.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(sku.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : selectedCategory ? (
              <div className="text-center py-8 text-muted-foreground">
                No SKUs in this category yet
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a category to view SKUs
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SKU Details</DialogTitle>
            <DialogDescription>
              Complete information for this SKU code
            </DialogDescription>
          </DialogHeader>
          {selectedSku && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">SKU Code</label>
                <p className="font-mono text-lg font-bold">{selectedSku.skuCode}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Product Name</label>
                <p>{selectedSku.productName || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Description</label>
                <p className="text-sm text-muted-foreground">
                  {selectedSku.description || "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Sequence #</label>
                  <p>{selectedSku.sequenceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <p>{selectedSku.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Created</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSku.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 font-medium ${
            activeTab === "generate"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-muted-foreground"
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 font-medium ${
            activeTab === "search"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-muted-foreground"
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-4 py-2 font-medium ${
            activeTab === "category"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-muted-foreground"
          }`}
        >
          By Category
        </button>
      </div>
    </div>
  );
}
