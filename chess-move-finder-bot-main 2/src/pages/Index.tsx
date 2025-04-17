
import { useEffect } from "react";
import ChessGame from "@/components/ChessGame";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  useEffect(() => {
    toast({
      title: "Welcome to Chess Move Finder!",
      description: "Select a piece to see available moves. Play against the AI!",
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <h1 className="text-4xl font-bold text-slate-800 mb-6">Chess Move Finder</h1>
      <ChessGame />
    </div>
  );
};

export default Index;
