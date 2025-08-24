import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function BackToDashboard() {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      className="pl-0"
      aria-label="Back to Dashboard"
      onClick={() => navigate("/")}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Dashboard
    </Button>
  );
}