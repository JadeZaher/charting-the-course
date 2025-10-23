import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link2, Upload, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Default Miro board to load on page startup
const DEFAULT_MIRO_BOARD = "https://miro.com/app/board/uXjVJ1mAUYI=/";

export default function MapView() {
  const [miroUrl, setMiroUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLoadMiroBoard = () => {
    if (!miroUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Miro board URL",
        variant: "destructive",
      });
      return;
    }

    // Validate and convert Miro board URL to embed URL
    try {
      const url = new URL(miroUrl.trim());
      
      // Security: Only allow Miro URLs
      if (!url.hostname.endsWith("miro.com")) {
        toast({
          title: "Error",
          description: "Only Miro board URLs are allowed",
          variant: "destructive",
        });
        return;
      }

      // Security: Only allow HTTPS
      if (url.protocol !== "https:") {
        toast({
          title: "Error",
          description: "Only HTTPS URLs are allowed",
          variant: "destructive",
        });
        return;
      }

      // Convert board URL to embed URL
      // Example: https://miro.com/app/board/ABC123 -> https://miro.com/app/live-embed/ABC123
      let embedUrl = url.href;
      
      if (url.pathname.includes("/app/board/")) {
        const boardId = url.pathname.split("/app/board/")[1]?.split("/")[0];
        if (boardId) {
          embedUrl = `https://miro.com/app/live-embed/${boardId}`;
        }
      } else if (!url.pathname.includes("/app/live-embed/")) {
        // If it's not a board or embed URL, reject it
        toast({
          title: "Error",
          description: "Please provide a valid Miro board URL (e.g., https://miro.com/app/board/...)",
          variant: "destructive",
        });
        return;
      }

      setEmbedUrl(embedUrl);
      setUploadedImage(null); // Clear image when loading Miro board
      
      toast({
        title: "Success",
        description: "Miro board loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid URL format",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setEmbedUrl(""); // Clear Miro embed when uploading image
      toast({
        title: "Success",
        description: "Mindmap image uploaded successfully",
      });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAll = () => {
    setMiroUrl("");
    setEmbedUrl("");
    setUploadedImage(null);
    toast({
      title: "Cleared",
      description: "All content has been cleared",
    });
  };

  // Auto-load default Miro board on component mount
  useEffect(() => {
    const loadDefaultBoard = () => {
      try {
        const url = new URL(DEFAULT_MIRO_BOARD);
        
        // Extract board ID and create embed URL
        const boardId = url.pathname.split("/app/board/")[1]?.split("/")[0];
        if (boardId) {
          const embedUrl = `https://miro.com/app/live-embed/${boardId}`;
          setMiroUrl(DEFAULT_MIRO_BOARD);
          setEmbedUrl(embedUrl);
        }
      } catch (error) {
        console.error("Failed to load default Miro board:", error);
      }
    };

    loadDefaultBoard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Collaborative Mindmap</h1>
        <p className="text-muted-foreground mt-1">
          View global collaborative mindmaps created during webinars
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Embed a Miro board by pasting its URL below, or upload a static mindmap image.
          Miro boards allow interactive exploration of collaboration concepts from webinars.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Miro Embed Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Miro Board Embed
            </CardTitle>
            <CardDescription>
              Paste a Miro board URL to embed it below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="miro-url">Miro Board URL</Label>
              <Input
                id="miro-url"
                type="url"
                placeholder="https://miro.com/app/board/..."
                value={miroUrl}
                onChange={(e) => setMiroUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLoadMiroBoard()}
                data-testid="input-miro-url"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleLoadMiroBoard} 
                className="flex-1"
                data-testid="button-load-miro"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Load Board
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://miro.com", "_blank")}
                data-testid="button-open-miro"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Static Mindmap Image
            </CardTitle>
            <CardDescription>
              Upload a screenshot or exported mindmap image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                data-testid="input-upload-image"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                data-testid="button-upload-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image File
              </Button>
            </div>
            {(embedUrl || uploadedImage) && (
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="w-full"
                data-testid="button-clear-all"
              >
                Clear All
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Display Area */}
      <Card>
        <CardContent className="p-0">
          {embedUrl ? (
            <div className="relative w-full" style={{ height: "70vh" }}>
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="fullscreen; clipboard-read; clipboard-write"
                allowFullScreen
                loading="lazy"
                title="Miro Board"
                data-testid="iframe-miro-board"
              />
            </div>
          ) : uploadedImage ? (
            <div className="relative w-full bg-muted" style={{ minHeight: "70vh" }}>
              <img
                src={uploadedImage}
                alt="Uploaded mindmap"
                className="w-full h-full object-contain"
                data-testid="img-uploaded-mindmap"
              />
            </div>
          ) : (
            <div 
              className="flex items-center justify-center bg-muted text-muted-foreground"
              style={{ height: "70vh" }}
              data-testid="placeholder-empty"
            >
              <div className="text-center space-y-2">
                <Link2 className="h-12 w-12 mx-auto opacity-20" />
                <p className="text-lg font-medium">No mindmap loaded</p>
                <p className="text-sm">
                  Embed a Miro board or upload an image to get started
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
