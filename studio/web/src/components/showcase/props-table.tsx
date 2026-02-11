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
  /** Component name for accessibility labeling */
  componentName?: string;
}

export function PropsTable({ props, componentName }: PropsTableProps) {
  if (props.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        This component accepts standard HTML attributes.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden overflow-x-auto">
      <Table>
        <caption className="sr-only">
          {componentName ? `Props for ${componentName} component` : "Component props"}
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]" scope="col">Prop</TableHead>
            <TableHead className="w-[250px]" scope="col">Type</TableHead>
            <TableHead className="w-[100px]" scope="col">Default</TableHead>
            <TableHead scope="col">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.map((prop) => (
            <TableRow key={prop.name}>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <code>{prop.name}</code>
                  {prop.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono break-all">
                  {prop.type}
                </code>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {prop.default ? (
                  <code className="text-xs">{prop.default}</code>
                ) : (
                  <span aria-label="No default value">—</span>
                )}
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
