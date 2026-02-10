import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@/components/ui";
import type { ComponentProp } from "@/lib/showcase";

interface PropsTableProps {
  props: ComponentProp[];
}

export function PropsTable({ props }: PropsTableProps) {
  if (props.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This component accepts standard HTML attributes.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Prop</TableHead>
            <TableHead className="w-[250px]">Type</TableHead>
            <TableHead className="w-[100px]">Default</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.map((prop) => (
            <TableRow key={prop.name}>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span>{prop.name}</span>
                  {prop.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                  {prop.type}
                </code>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {prop.default ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {prop.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
