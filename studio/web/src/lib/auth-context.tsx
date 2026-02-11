// =====================================================
// Auth Context Re-exports
// =====================================================
//
// Studio uses its own auth context at @/contexts/auth-context
// for admin-specific authentication (admin login endpoint, role checks).
//
// For shared components that need the core auth context,
// re-export from core here.
// =====================================================

// Re-export core auth context for shared components
export * from "@core/lib/auth-context";

// NOTE: The Studio admin pages use @/contexts/auth-context directly
// because they need admin-specific functionality:
// - Admin login endpoint (/auth/admin/login)
// - Admin role checks (isAdmin, isSuperAdmin)
// - Studio-specific error handling
