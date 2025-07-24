import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, BookOpen, Download, Scale, Shield, AlertTriangle, FileText, Gavel } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const educationItems = [
  {
    title: "Understanding Your Credit Report",
    type: "Interactive Guide",
    duration: "15 min",
    description: "Learn how to identify FCRA violations and inaccuracies that creditors hope you'll miss.",
    icon: FileText,
    level: "Essential",
    category: "Credit Reports"
  },
  {
    title: "FCRA Rights and Protections",
    type: "Legal Guide",
    duration: "20 min", 
    description: "Know your rights under federal law and how creditors commonly violate them without consequences.",
    icon: Scale,
    level: "Essential",
    category: "Legal Rights"
  },
  {
    title: "Dealing with Collections",
    type: "Action Plan",
    duration: "18 min",
    description: "Stop illegal collection practices and enforce your FDCPA rights that many don't know exist.",
    icon: Shield,
    level: "Intermediate",
    category: "Collections"
  },
  {
    title: "Credit Laws and Regulations", 
    type: "Legal Overview",
    duration: "25 min",
    description: "Comprehensive overview of laws protecting consumers from creditor abuses and violations.",
    icon: Gavel,
    level: "Advanced",
    category: "Legal Rights"
  },
  {
    title: "Dispute Letter Strategies",
    type: "Templates & Guide",
    duration: "12 min",
    description: "Legally compliant dispute strategies that creditors must respond to under federal law.",
    icon: BookOpen,
    level: "Intermediate", 
    category: "Disputes"
  },
  {
    title: "Credit Building and Protection",
    type: "Strategy Guide",
    duration: "22 min",
    description: "Build credit while protecting yourself from creditor violations and unauthorized reporting.",
    icon: AlertTriangle,
    level: "Intermediate",
    category: "Credit Building"
  }
];

const categories = ["All", "Legal Rights", "Credit Reports", "Collections", "Disputes", "Credit Building"];

export default function Education() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<typeof educationItems[0] | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredItems = selectedCategory === "All" 
    ? educationItems 
    : educationItems.filter(item => item.category === selectedCategory);

  const handleItemClick = async (item: typeof educationItems[0]) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    setIsLoading(true);
    setContent("");

    try {
      const { data, error } = await supabase.functions.invoke('education-content', {
        body: {
          topic: item.title,
          contentType: item.type.toLowerCase()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setContent(data.content);
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: "Error",
        description: "Failed to load educational content. Please try again.",
        variant: "destructive"
      });
      setContent("Unable to load content at this time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Essential": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Credit Education Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover your rights under federal credit laws and learn how creditors commonly violate consumer protections. 
            Knowledge is power in credit repair.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="mb-2"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Education Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="card-elegant hover-lift cursor-pointer transition-all duration-300 border-l-4 border-l-accent" 
                onClick={() => handleItemClick(item)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <Badge className={getLevelColor(item.level)}>
                      {item.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground mb-2">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-sm">{item.duration}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-foreground mb-4 leading-relaxed">{item.description}</p>
                  <Button variant="outline" size="sm" className="w-full group">
                    <span className="group-hover:mr-2 transition-all">Learn Your Rights</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-3xl mx-auto card-elegant">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                Protect Your Credit Rights
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Don't let creditors take advantage of your lack of knowledge about federal protections. 
                Learn the laws that are designed to protect you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Scale className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Know Your Rights</h3>
                  <p className="text-sm text-muted-foreground">Under FCRA, FDCPA, and ECOA</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Spot Violations</h3>
                  <p className="text-sm text-muted-foreground">Identify when creditors break the law</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Gavel className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Enforce Protection</h3>
                  <p className="text-sm text-muted-foreground">Take action against violations</p>
                </div>
              </div>
              <Button className="w-full" size="lg">
                Start Learning Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.icon && <selectedItem.icon className="h-5 w-5 text-accent" />}
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.type} • {selectedItem?.duration} • {selectedItem?.level} Level
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button disabled={isLoading}>
              {isLoading ? "Loading..." : "Bookmark"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}