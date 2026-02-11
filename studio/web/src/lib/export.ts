// =====================================================
// Export Utilities
// =====================================================
//
// Re-exports data export utilities from core.
// These utilities help with exporting data as CSV, JSON, etc.
//
// Available exports:
// - downloadFile(url, filename) - Trigger file download
// - exportToCSV(data, filename) - Export array to CSV
// - exportToJSON(data, filename) - Export data to JSON
// - formatDataForExport(data) - Format data for export
//
// Usage:
//   import { exportToCSV, downloadFile } from "@/lib/export";
//
//   // Export table data to CSV
//   exportToCSV(users, "users-export.csv");
//
//   // Download from API endpoint
//   downloadFile(api.getOrdersExportUrl(), "orders.csv");
// =====================================================

export * from "@core/lib/export";
