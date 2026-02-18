'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EmptyState } from '@/components/shared/empty-state';
import { Alert } from '@/components/feedback/alert';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { SearchInput } from '@/components/ui/search-input';
import { providerApi, serviceApi } from '@/lib/booking/api';
import {
  formatPrice,
  formatDuration,
  getServiceStatusVariant,
} from '@/lib/booking/formatters';
import type { BookingService, Provider } from '@/lib/booking/types';

// =============================================================================
// Page Component
// =============================================================================

export default function ProviderServicesPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [linkedServices, setLinkedServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // Link service dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [availableServices, setAvailableServices] = useState<BookingService[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch provider's list to find own profile (providers/me pattern via list)
      const response = await providerApi.list({ limit: 100 });
      // Find the current user's provider profile - the API returns the provider's data
      // For the provider dashboard, the first result from their perspective is their profile
      if (response.items.length > 0) {
        const myProvider = response.items[0];
        setProvider(myProvider);

        // Fetch the full provider with linked services
        const fullProvider = await providerApi.getById(myProvider.id);
        setLinkedServices(fullProvider.services ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load provider data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const fetchAvailableServices = useCallback(async () => {
    try {
      setAvailableLoading(true);
      const response = await serviceApi.list({
        search: linkSearch || undefined,
        limit: 50,
      });

      // Filter out already-linked services
      const linkedIds = new Set(linkedServices.map((s) => s.id));
      setAvailableServices(response.items.filter((s) => !linkedIds.has(s.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available services');
    } finally {
      setAvailableLoading(false);
    }
  }, [linkSearch, linkedServices]);

  useEffect(() => {
    if (showLinkDialog) {
      fetchAvailableServices();
    }
  }, [showLinkDialog, fetchAvailableServices]);

  const handleUnlink = async (serviceId: string) => {
    if (!provider) return;

    try {
      setUnlinkingId(serviceId);
      await providerApi.unlinkService(provider.id, serviceId);
      setLinkedServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink service');
    } finally {
      setUnlinkingId(null);
    }
  };

  const handleLink = async (serviceId: string) => {
    if (!provider) return;

    try {
      setLinkingId(serviceId);
      await providerApi.linkService(provider.id, serviceId);

      // Move the service from available to linked
      const service = availableServices.find((s) => s.id === serviceId);
      if (service) {
        setLinkedServices((prev) => [...prev, service]);
        setAvailableServices((prev) => prev.filter((s) => s.id !== serviceId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link service');
    } finally {
      setLinkingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (full page)
  if (error && linkedServices.length === 0 && !provider) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error">
          <p className="mt-1">{error}</p>
          <Button
            variant="destructive"
            onClick={fetchProvider}
            className="mt-3"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Services</h1>
          <p className="mt-1 text-muted-foreground">
            Manage services you offer to clients
          </p>
        </div>
        <Button onClick={() => setShowLinkDialog(true)}>
          Link New Service
        </Button>
      </div>

      {/* Error banner (non-blocking) */}
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Services list */}
      {linkedServices.length === 0 ? (
        <EmptyState
          title="No linked services"
          description="You haven't linked any services yet. Link a service to start accepting bookings."
          action={{
            label: 'Link New Service',
            onClick: () => setShowLinkDialog(true),
          }}
        />
      ) : (
        <div className="grid gap-4">
          {linkedServices.map((service) => (
            <Card key={service.id}>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {service.name}
                      </h3>
                      <Badge variant={getServiceStatusVariant(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDuration(service.duration)}</span>
                      <span>{formatPrice(service.price, service.currency)}</span>
                    </div>
                  </div>
                  <ConfirmButton
                    confirmMode="dialog"
                    confirmTitle="Unlink Service"
                    confirmMessage={`Are you sure you want to unlink "${service.name}"? You will stop receiving bookings for this service.`}
                    variant="outline"
                    size="sm"
                    onConfirm={() => handleUnlink(service.id)}
                    disabled={unlinkingId === service.id}
                  >
                    {unlinkingId === service.id ? 'Unlinking...' : 'Unlink'}
                  </ConfirmButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link Service Dialog */}
      <Dialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        size="lg"
      >
        <DialogHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Link a Service
          </h2>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <SearchInput
              placeholder="Search available services..."
              onSearch={setLinkSearch}
              debounceDelay={300}
            />

            {availableLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : availableServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {linkSearch
                    ? 'No matching services found.'
                    : 'All available services are already linked.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableServices.map((service) => (
                  <Card key={service.id} variant="outline">
                    <CardContent>
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {service.name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{formatDuration(service.duration)}</span>
                            <span>{formatPrice(service.price, service.currency)}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLink(service.id)}
                          isLoading={linkingId === service.id}
                        >
                          Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
