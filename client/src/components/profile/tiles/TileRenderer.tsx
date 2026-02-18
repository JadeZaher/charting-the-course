import { BadgeTile } from "./BadgeTile";
import { TextTile } from "./TextTile";
import { ChartTile } from "./ChartTile";
import { ListTile } from "./ListTile";
import { ScoreTile } from "./ScoreTile";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProfileTile {
  id: string;
  user_id: string;
  submission_id: string;
  tile_type: 'badge' | 'text' | 'chart' | 'list' | 'score' | 'custom';
  dimension: string | null;
  title: string;
  content: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface TileRendererProps {
  tile: ProfileTile;
  isOwner?: boolean;
  onToggleVisibility?: (tileId: string, isVisible: boolean) => void;
}

const TILE_COMPONENTS: Record<string, React.ComponentType<{ data: { title: string; content: any } }>> = {
  badge: BadgeTile,
  text: TextTile,
  chart: ChartTile,
  list: ListTile,
  score: ScoreTile,
};

export function TileRenderer({ tile, isOwner = false, onToggleVisibility }: TileRendererProps) {
  const Component = TILE_COMPONENTS[tile.tile_type];
  
  if (!Component) {
    return (
      <Card className="h-full border-destructive/50">
        <CardContent className="p-4 text-center text-muted-foreground">
          Unknown tile type: {tile.tile_type}
        </CardContent>
      </Card>
    );
  }

  const tileData = {
    title: tile.title,
    content: tile.content,
  };

  return (
    <div className="relative group" data-testid={`tile-${tile.id}`}>
      <Component data={tileData} />
      {isOwner && onToggleVisibility && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
          onClick={() => onToggleVisibility(tile.id, !tile.is_visible)}
          data-testid={`button-toggle-visibility-${tile.id}`}
        >
          {tile.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  );
}

export function TileGrid({ 
  tiles, 
  isOwner = false, 
  onToggleVisibility,
  showHidden = false
}: { 
  tiles: ProfileTile[]; 
  isOwner?: boolean;
  onToggleVisibility?: (tileId: string, isVisible: boolean) => void;
  showHidden?: boolean;
}) {
  const displayTiles = showHidden ? tiles : tiles.filter(t => t.is_visible);
  const sortedTiles = [...displayTiles].sort((a, b) => a.display_order - b.display_order);

  if (sortedTiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No profile insights yet. Take some quizzes to build your profile!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedTiles.map((tile) => (
        <div 
          key={tile.id} 
          className={!tile.is_visible && isOwner ? "opacity-50" : ""}
        >
          <TileRenderer 
            tile={tile} 
            isOwner={isOwner} 
            onToggleVisibility={onToggleVisibility}
          />
        </div>
      ))}
    </div>
  );
}
