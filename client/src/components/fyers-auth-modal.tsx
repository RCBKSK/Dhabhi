import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FyersAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FyersAuthModal({ isOpen, onClose }: FyersAuthModalProps) {
  const [authCode, setAuthCode] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const authUrl = "https://api-t1.fyers.in/api/v3/generate-authcode?client_id=X1F4L84TYK-100&redirect_uri=https://trade.fyers.in/api-login/redirect-uri/index.html&response_type=code&state=sample_state";

  const handleAuthenticate = async () => {
    if (!authCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the auth code",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await apiRequest("POST", "/api/fyers/authenticate", { authCode: authCode.trim() });
      const data = await response.json();

      toast({
        title: "Success",
        description: "Live data is now enabled! The dashboard will refresh automatically.",
        variant: "default"
      });

      // Invalidate all stock queries to refetch with live data
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/upper"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks/lower"] });
      
      onClose();
      setAuthCode("");
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate with Fyers API",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const openAuthUrl = () => {
    window.open(authUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Live Data</DialogTitle>
          <DialogDescription>
            Authenticate with Fyers API to get live Indian stock market data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Step 1: Click below to authenticate with Fyers
            </p>
            <Button onClick={openAuthUrl} variant="outline" className="w-full">
              Open Fyers Authentication
            </Button>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Step 2: Copy the auth code from the redirect URL and paste it here
            </p>
            <Input
              placeholder="Enter auth code here..."
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button 
            onClick={handleAuthenticate} 
            disabled={isAuthenticating || !authCode.trim()}
            className="w-full"
          >
            {isAuthenticating ? "Authenticating..." : "Enable Live Data"}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            After authentication, the dashboard will automatically switch from mock data to live market data from Fyers API.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}