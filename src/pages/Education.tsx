import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, BookOpen, Download } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";

const educationItems = [
  {
    title: "Understanding Your Credit Report",
    type: "Video",
    duration: "15 min",
    description: "Learn how to read and interpret your credit report, including identifying errors and understanding scoring factors.",
    icon: PlayCircle,
    level: "Beginner"
  },
  {
    title: "FCRA Rights and Protections",
    type: "Article",
    duration: "10 min",
    description: "Comprehensive guide to your rights under the Fair Credit Reporting Act and how to use them effectively.",
    icon: BookOpen,
    level: "Intermediate"
  },
  {
    title: "Dispute Letter Templates",
    type: "Download",
    duration: "5 min",
    description: "Professional dispute letter templates for various credit report errors and inaccuracies.",
    icon: Download,
    level: "All Levels"
  },
  {
    title: "Credit Building Strategies",
    type: "Video",
    duration: "20 min",
    description: "Proven strategies for building and maintaining excellent credit scores over time.",
    icon: PlayCircle,
    level: "Intermediate"
  },
  {
    title: "Dealing with Collections",
    type: "Article",
    duration: "12 min",
    description: "Step-by-step guide for handling collection accounts and negotiating with collectors.",
    icon: BookOpen,
    level: "Advanced"
  },
  {
    title: "Credit Laws and Regulations",
    type: "Video",
    duration: "25 min",
    description: "Overview of key credit laws including FCRA, FDCPA, and ECOA that protect consumers.",
    icon: PlayCircle,
    level: "Advanced"
  }
];

export default function Education() {
  const handleItemClick = (item: typeof educationItems[0]) => {
    // Placeholder for future implementation
    console.log("Opening:", item.title);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Credit Education Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expand your knowledge with our comprehensive collection of credit repair resources, guides, and educational content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {educationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="transition-all duration-300 hover:shadow-elegant cursor-pointer" onClick={() => handleItemClick(item)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline">{item.level}</Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-sm">{item.duration}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-foreground mb-4">{item.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    {item.type === "Video" ? "Watch Now" : item.type === "Article" ? "Read Article" : "Download"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-foreground">Need More Help?</CardTitle>
              <CardDescription className="text-muted-foreground">
                Our education center is continuously updated with new content to help you succeed in your credit repair journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Request Additional Resources</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}