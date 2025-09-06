import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Settings,
  BarChart3,
  ShoppingCart,
  Eye,
  Plus,
  CreditCard,
  Search,
  Heart,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_ORIGIN } from '@/lib/adminApi';
import { Loader2 } from 'lucide-react';

interface MetaSettings {
  pixelId: string;
  businessId: string;
  catalogId: string;
  adAccountId: string;
  domainVerificationCode: string;
  accessToken?: string;
  isActive: boolean;
}

interface EventLog {
  _id: string;
  eventName: string;
  payload: any;
  userId?: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  errorMessage?: string;
}

interface SyncStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  errorLog: Array<{
    productId: string;
    error: string;
    timestamp: string;
  }>;
}

const MetaIntegration: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState<MetaSettings>({
    pixelId: '',
    businessId: '',
    catalogId: '',
    adAccountId: '',
    domainVerificationCode: '',
    accessToken: '',
    isActive: false
  });
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  // Backend base URL: prefer VITE_BACKEND_URL; fallback to VITE_API_URL (strip /api/v1/admin)
  const API_BASE = BACKEND_ORIGIN;

  const metaUrl = (path: string) => `${API_BASE}${path}`;

  const getErrorText = (e: any) =>
    typeof e === 'string'
      ? e
      : e?.message || e?.error?.message || e?.toString?.() || 'Something went wrong';

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadSyncStatus();
    loadEventLogs();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/settings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/catalog/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSyncStatus(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadEventLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/events/logs?limit=50'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEventLogs(data.data.logs);
        }
      }
    } catch (error) {
      console.error('Error loading event logs:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Settings saved',
          description: 'Meta integration settings have been updated successfully.'
        });
        setSettings(data.data);
      } else {
        toast({
          title: 'Error',
          description: getErrorText(data),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorText(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/test-connection'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description: 'Successfully connected to Meta Graph API'
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: 'Connection failed',
          description: getErrorText(data),
          variant: 'destructive'
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Connection failed',
        description: getErrorText(error),
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const syncCatalog = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/catalog/sync'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ batchSize: 100 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sync started',
          description: data.message || 'Product catalog sync has been initiated'
        });
        loadSyncStatus();
      } else {
        toast({
          title: 'Sync failed',
          description: getErrorText(data),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: getErrorText(error),
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const exportEventLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(metaUrl('/api/v1/meta/events/export'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meta-events-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Export successful',
          description: 'Event logs have been exported successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: getErrorText(error),
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    const variants = {
      idle: 'secondary',
      running: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getEventIcon = (eventName: string) => {
    const icons = {
      PageView: Eye,
      ViewContent: Eye,
      AddToCart: Plus,
      Purchase: CreditCard,
      InitiateCheckout: ShoppingCart,
      Search: Search,
      AddToWishlist: Heart,
      Lead: UserPlus,
      CompleteRegistration: UserCheck
    };
    
    const Icon = icons[eventName as keyof typeof icons] || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meta Integration</h1>
          <p className="text-muted-foreground">
            Configure and manage your Meta (Facebook) advertising integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={testConnection}
            disabled={testingConnection || !settings.pixelId}
            variant="outline"
          >
            {testingConnection ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              getStatusIcon(connectionStatus)
            )}
            Test Connection
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="links">Setup Links</TabsTrigger>
          <TabsTrigger value="catalog">Catalog Sync</TabsTrigger>
          <TabsTrigger value="events">Event Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Meta Configuration
              </CardTitle>
              <CardDescription>
                Configure your Meta Pixel, Business, and Catalog settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pixelId">Pixel ID *</Label>
                  <Input
                    id="pixelId"
                    value={settings.pixelId}
                    onChange={(e) => setSettings({ ...settings, pixelId: e.target.value })}
                    placeholder="Enter your Meta Pixel ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessId">Business ID *</Label>
                  <Input
                    id="businessId"
                    value={settings.businessId}
                    onChange={(e) => setSettings({ ...settings, businessId: e.target.value })}
                    placeholder="Enter your Meta Business ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalogId">Catalog ID *</Label>
                  <Input
                    id="catalogId"
                    value={settings.catalogId}
                    onChange={(e) => setSettings({ ...settings, catalogId: e.target.value })}
                    placeholder="Enter your Meta Catalog ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adAccountId">Ad Account ID *</Label>
                  <Input
                    id="adAccountId"
                    value={settings.adAccountId}
                    onChange={(e) => setSettings({ ...settings, adAccountId: e.target.value })}
                    placeholder="Enter your Meta Ad Account ID"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domainVerificationCode">Domain Verification Code *</Label>
                <Input
                  id="domainVerificationCode"
                  value={settings.domainVerificationCode}
                  onChange={(e) => setSettings({ ...settings, domainVerificationCode: e.target.value })}
                  placeholder="Enter your domain verification code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token *</Label>
                <Textarea
                  id="accessToken"
                  value={settings.accessToken || ''}
                  onChange={(e) => setSettings({ ...settings, accessToken: e.target.value })}
                  placeholder="Enter your Meta Access Token"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your Meta Access Token. It will be encrypted and stored securely.
                </p>
              </div>

              <Button onClick={saveSettings} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Setup Links</CardTitle>
              <CardDescription>
                Quick access to Meta Business Manager tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Events Manager (Pixel)</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`https://business.facebook.com/events_manager2/list/${settings.pixelId}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Events Manager
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Catalog (Commerce Manager)</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`https://business.facebook.com/commerce/catalogs/${settings.catalogId}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Catalog
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Shop Setup (Commerce Manager)</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`https://business.facebook.com/commerce/shops/${settings.businessId}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Shop Setup
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Ads Manager</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://business.facebook.com/adsmanager" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Ads Manager
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Business Settings</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Business Settings
                    </a>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Domain Verification</Label>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://business.facebook.com/settings/owned-domains" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Domain Verification
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Catalog Sync</CardTitle>
              <CardDescription>
                Sync your products with Meta Catalog for advertising
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Sync Status:</span>
                      {getSyncStatusBadge(syncStatus.status)}
                    </div>
                    <Button
                      onClick={syncCatalog}
                      disabled={syncing || syncStatus.status === 'running'}
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {syncStatus.status === 'running' ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{syncStatus.totalProducts}</div>
                      <div className="text-sm text-muted-foreground">Total Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{syncStatus.syncedProducts}</div>
                      <div className="text-sm text-muted-foreground">Synced</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{syncStatus.failedProducts}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  
                  {syncStatus.lastRun && (
                    <div className="text-sm text-muted-foreground">
                      Last run: {new Date(syncStatus.lastRun).toLocaleString()}
                    </div>
                  )}
                  
                  {syncStatus.errorLog.length > 0 && (
                    <div className="space-y-2">
                      <Label>Recent Errors</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {syncStatus.errorLog.slice(0, 5).map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription className="text-xs">
                              <strong>Product {error.productId}:</strong> {error.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Event Tracking Dashboard</span>
                <Button onClick={exportEventLogs} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
              <CardDescription>
                Monitor conversion events and tracking performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events tracked yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventLogs.map((log) => (
                      <div key={log._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getEventIcon(log.eventName)}
                          <div>
                            <div className="font-medium">{log.eventName}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.userId && `User: ${log.userId}`}
                              {log.userId && ' • '}
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                          {log.errorMessage && (
                            <span className="text-xs text-red-500">{log.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
};

export default MetaIntegration;
