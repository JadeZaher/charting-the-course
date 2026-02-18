import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartTileProps {
  data: {
    title: string;
    content: {
      chart_type?: 'bar' | 'radar' | 'pie' | 'line';
      chart_data?: Array<{ label: string; value: number; color?: string }>;
    };
  };
}

export function ChartTile({ data }: ChartTileProps) {
  const { title, content } = data;
  const chartData = content.chart_data || [];
  const maxValue = Math.max(...chartData.map(d => d.value), 100);

  return (
    <Card className="h-full">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base" data-testid="text-chart-title">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        <div className="space-y-3">
          {chartData.map((item, index) => (
            <div key={index} className="space-y-1" data-testid={`chart-bar-${index}`}>
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || undefined
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
