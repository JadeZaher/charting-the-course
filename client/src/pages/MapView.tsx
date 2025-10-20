import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize2, Users, BookOpen } from "lucide-react";
import mapBgImage from "@assets/generated_images/Map_view_network_background_3a94a769.png";

// TODO: remove mock functionality
const mockNodes = [
  {
    id: "team-1",
    type: "team" as const,
    label: "Core Team",
    x: 30,
    y: 30,
    members: 8,
    connections: ["course-1", "course-2"],
  },
  {
    id: "team-2",
    type: "team" as const,
    label: "Development",
    x: 70,
    y: 25,
    members: 12,
    connections: ["course-2", "course-3"],
  },
  {
    id: "course-1",
    type: "course" as const,
    label: "Foundations",
    x: 25,
    y: 60,
    students: 24,
    connections: [],
  },
  {
    id: "course-2",
    type: "course" as const,
    label: "Leadership",
    x: 50,
    y: 55,
    students: 18,
    connections: [],
  },
  {
    id: "course-3",
    type: "course" as const,
    label: "Communication",
    x: 75,
    y: 65,
    students: 15,
    connections: [],
  },
];

export default function MapView() {
  const [selectedNode, setSelectedNode] = useState<typeof mockNodes[0] | null>(null);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleReset = () => setZoom(100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Team & Course Map</h1>
          <p className="text-muted-foreground mt-1">
            Visual overview of team structure and course relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            data-testid="button-reset-zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 150}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className="relative w-full aspect-[16/10] bg-muted overflow-hidden"
                style={{
                  backgroundImage: `url(${mapBgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                data-testid="map-canvas"
              >
                {/* Overlay for better contrast */}
                <div className="absolute inset-0 bg-background/40" />

                {/* Map content with zoom */}
                <div
                  className="relative w-full h-full transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {/* Draw connections */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {mockNodes.map((node) =>
                      node.connections.map((targetId) => {
                        const target = mockNodes.find((n) => n.id === targetId);
                        if (!target) return null;
                        return (
                          <line
                            key={`${node.id}-${targetId}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2={`${target.x}%`}
                            y2={`${target.y}%`}
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            opacity="0.4"
                          />
                        );
                      })
                    )}
                  </svg>

                  {/* Nodes */}
                  {mockNodes.map((node) => (
                    <button
                      key={node.id}
                      className={`
                        absolute -translate-x-1/2 -translate-y-1/2 transition-all
                        ${node.type === "team" ? "w-24 h-24" : "w-28 h-20"}
                        ${selectedNode?.id === node.id ? "scale-110 z-10" : "hover:scale-105"}
                      `}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      onClick={() => setSelectedNode(node)}
                      data-testid={`node-${node.id}`}
                    >
                      <div
                        className={`
                          w-full h-full flex flex-col items-center justify-center gap-2
                          bg-card border-2 shadow-lg hover-elevate active-elevate-2
                          ${node.type === "team" ? "rounded-full" : "rounded-xl"}
                          ${selectedNode?.id === node.id ? "border-primary" : "border-card-border"}
                        `}
                      >
                        {node.type === "team" ? (
                          <Users className="h-6 w-6 text-primary" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-primary" />
                        )}
                        <span className="text-xs font-medium px-2 text-center line-clamp-2">
                          {node.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Zoom indicator */}
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg border text-sm font-medium">
                  {zoom}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-card border-2 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Team</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-card border-2 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm">Course</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg width="40" height="2">
                    <line
                      x1="0"
                      y1="1"
                      x2="40"
                      y2="1"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                  </svg>
                  <span className="text-sm">Connection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedNode && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    {selectedNode.type === "team" ? (
                      <Users className="h-6 w-6 text-primary flex-shrink-0" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid="text-selected-node">
                        {selectedNode.label}
                      </h3>
                      <Badge variant="outline" className="mt-2">
                        {selectedNode.type === "team" ? "Team" : "Course"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    {selectedNode.type === "team" ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{selectedNode.members}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Students</span>
                        <span className="font-medium">{selectedNode.students}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Connections</span>
                      <span className="font-medium">{selectedNode.connections.length}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="sm" data-testid="button-view-details">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
