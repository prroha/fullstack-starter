"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { InvoiceItem, InvoiceItemInput, TaxRate } from "../../lib/invoicing/types";
import { formatPrice } from "../../lib/invoicing/formatters";

interface InvoiceLineItemsProps {
  items: InvoiceItem[];
  taxRates: TaxRate[];
  currency?: string;
  readOnly?: boolean;
  onAddItem?: (item: InvoiceItemInput) => Promise<void>;
  onUpdateItem?: (itemId: string, item: Partial<InvoiceItemInput>) => Promise<void>;
  onDeleteItem?: (itemId: string) => Promise<void>;
}

export default function InvoiceLineItems({
  items,
  taxRates,
  currency = "usd",
  readOnly = false,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: InvoiceLineItemsProps) {
  const [newDescription, setNewDescription] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newTaxRateId, setNewTaxRateId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editTaxRateId, setEditTaxRateId] = useState("");

  const taxRateOptions = [
    { value: "", label: "No Tax" },
    ...taxRates.map((tr) => ({
      value: tr.id,
      label: `${tr.name} (${tr.rate}%)`,
    })),
  ];

  const handleAdd = async () => {
    if (!newDescription.trim() || !newUnitPrice) return;
    setIsAdding(true);
    try {
      await onAddItem?.({
        description: newDescription.trim(),
        quantity: parseFloat(newQuantity) || 1,
        unitPrice: Math.round(parseFloat(newUnitPrice) * 100),
        taxRateId: newTaxRateId || undefined,
      });
      setNewDescription("");
      setNewQuantity("1");
      setNewUnitPrice("");
      setNewTaxRateId("");
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (item: InvoiceItem) => {
    setEditingId(item.id);
    setEditDescription(item.description);
    setEditQuantity(String(item.quantity));
    setEditUnitPrice(String(item.unitPrice / 100));
    setEditTaxRateId(item.taxRateId ?? "");
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editDescription.trim() || !editUnitPrice) return;
    await onUpdateItem?.(itemId, {
      description: editDescription.trim(),
      quantity: parseFloat(editQuantity) || 1,
      unitPrice: Math.round(parseFloat(editUnitPrice) * 100),
      taxRateId: editTaxRateId || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead className="w-20 text-right">Qty</TableHead>
            <TableHead className="w-28 text-right">Unit Price</TableHead>
            <TableHead className="w-32">Tax</TableHead>
            <TableHead className="w-28 text-right">Total</TableHead>
            {!readOnly && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {editingId === item.id ? (
                <>
                  <TableCell>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="h-8 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(e.target.value)}
                      className="h-8 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editTaxRateId}
                      onChange={setEditTaxRateId}
                      options={taxRateOptions}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(
                      Math.round((parseFloat(editQuantity) || 0) * (parseFloat(editUnitPrice) || 0) * 100),
                      currency
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(item.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.unitPrice, currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.taxRate ? `${item.taxRate.name} (${item.taxRate.rate}%)` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(item.totalPrice, currency)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteItem?.(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          ))}

          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={readOnly ? 5 : 6}
                className="text-center text-muted-foreground py-8"
              >
                No line items yet. Add your first item below.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add new item row */}
      {!readOnly && onAddItem && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
          <div className="flex-1 min-w-[200px] space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Item description"
              className="h-8"
            />
          </div>
          <div className="w-20 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Qty</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="h-8 text-right"
            />
          </div>
          <div className="w-28 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Unit Price</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newUnitPrice}
              onChange={(e) => setNewUnitPrice(e.target.value)}
              placeholder="0.00"
              className="h-8 text-right"
            />
          </div>
          <div className="w-40 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Tax Rate</span>
            <Select
              value={newTaxRateId}
              onChange={setNewTaxRateId}
              options={taxRateOptions}
            />
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            isLoading={isAdding}
            disabled={!newDescription.trim() || !newUnitPrice}
          >
            Add Item
          </Button>
        </div>
      )}
    </div>
  );
}
