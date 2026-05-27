import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonPaneProps {
  title: string;
  description: string;
}

export function ComingSoonPane({ title, description }: ComingSoonPaneProps) {
  return (
    <Card className="flex h-full items-center justify-center">
      <CardContent className="flex max-w-md flex-col items-center gap-3 py-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Once the corresponding Tauri command lands in <code>src-tauri/src/lib.rs</code>,
          this tab will light up automatically.
        </p>
      </CardContent>
    </Card>
  );
}
