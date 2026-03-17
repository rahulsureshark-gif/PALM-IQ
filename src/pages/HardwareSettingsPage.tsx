import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Server, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Check, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { usePalm } from '@/contexts/PalmContext';
import { useToast } from '@/hooks/use-toast';
import { PalmIQSDK } from '@/lib/capacitorPalmBridge';

const HardwareSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    connectionMode, 
    setConnectionMode, 
    serverUrl, 
    setServerUrl, 
    isHardwareConnected,
    checkHardwareConnection,
    registrations,
    requestUsbPermission,
    sdkStatus,
    lastError
  } = usePalm();

  const [tempServerUrl, setTempServerUrl] = useState(serverUrl);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [usbDevices, setUsbDevices] = useState<string | null>(null);
  const [isListingDevices, setIsListingDevices] = useState(false);

  useEffect(() => {
    setTempServerUrl(serverUrl);
  }, [serverUrl]);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    // Save the URL first if in server mode
    if (connectionMode === 'server' && tempServerUrl !== serverUrl) {
      setServerUrl(tempServerUrl);
    }
    
    const connected = await checkHardwareConnection();
    
    setConnectionStatus(connected ? 'success' : 'error');
    setIsTestingConnection(false);

    toast({
      title: connected ? 'Connection Successful' : 'Connection Failed',
      description: connected 
        ? 'Palm IQ hardware is ready to use' 
        : connectionMode === 'server' 
          ? 'Could not connect to server. Is it running?' 
          : lastError || 'Hardware not detected. Check USB connection.',
      variant: connected ? 'default' : 'destructive',
    });
  };

  const handleRequestUsbPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await requestUsbPermission();
      
      toast({
        title: result.granted ? 'USB Permission Granted' : 'USB Permission Denied',
        description: result.granted 
          ? 'You can now use the palm scanner' 
          : result.error || 'Please grant USB permission to use the scanner',
        variant: result.granted ? 'default' : 'destructive',
      });
      
      if (result.granted) {
        // Refresh connection status
        await checkHardwareConnection();
      }
    } catch (error) {
      toast({
        title: 'Permission Error',
        description: error instanceof Error ? error.message : 'Failed to request permission',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleListUsbDevices = async () => {
    setIsListingDevices(true);
    try {
      const result = await PalmIQSDK.listUsbDevices();
      setUsbDevices(
        `Found ${result.count} USB device(s)\n` +
        `Palm scanner found: ${result.palmScannerFound ? 'YES ✓' : 'NO'}\n` +
        `Looking for: VID=${result.targetVID} PID=${result.targetPID}\n\n` +
        result.devices
      );
    } catch (error) {
      setUsbDevices('Error listing devices: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsListingDevices(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tempServerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileLayout hideNav>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Hardware Settings</h1>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* Connection Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={connectionMode} 
                onValueChange={(value) => setConnectionMode(value as 'native' | 'server')}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="native" id="native" className="mt-1" />
                  <Label htmlFor="native" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Native SDK</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect directly via Android SDK. Best for mobile terminals.
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="server" id="server" className="mt-1" />
                  <Label htmlFor="server" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-medium">Windows Server</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect to a Windows PC running Palm IQ Server. For laptop/desktop use.
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Server URL (only shown when server mode is selected) */}
          {connectionMode === 'server' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Server URL</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={tempServerUrl}
                      onChange={(e) => setTempServerUrl(e.target.value)}
                      placeholder="http://192.168.1.100:8080"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyUrl}
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Same machine:</strong> http://localhost:8080</p>
                    <p><strong>Mobile on WiFi:</strong> http://[laptop-ip]:8080</p>
                  </div>

                  {tempServerUrl !== serverUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setServerUrl(tempServerUrl)}
                    >
                      Save URL
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {isHardwareConnected ? (
                    <Wifi className="h-5 w-5 text-primary" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isHardwareConnected ? 'Connected' : 'Not Connected'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {connectionMode === 'server' ? 'Windows Server' : 'Native SDK'}
                    </p>
                    {lastError && !isHardwareConnected && (
                      <p className="text-xs text-destructive mt-1">{lastError}</p>
                    )}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isHardwareConnected ? 'bg-primary' : 'bg-muted-foreground'}`} />
              </div>

              {/* SDK Status Details (Native mode only) */}
              {connectionMode === 'native' && sdkStatus && (
                <div className="text-xs space-y-1 p-2 rounded bg-muted/30">
                  <p>Device Found: {sdkStatus.deviceConnected ? '✓' : '✗'}</p>
                  <p>SDK Initialized: {sdkStatus.sdkInitialized ? '✓' : '✗'}</p>
                  <p>Model Loaded: {sdkStatus.modelLoaded ? '✓' : '✗'}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="flex-1"
                >
                  {isTestingConnection ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : connectionStatus === 'success' ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Connected
                    </>
                  ) : connectionStatus === 'error' ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Retry
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {/* USB Permission Button (Native mode only) */}
              {connectionMode === 'native' && (
                <div className="space-y-2">
                  <Button 
                    onClick={handleRequestUsbPermission}
                    disabled={isRequestingPermission}
                    variant="outline"
                    className="w-full"
                  >
                    {isRequestingPermission ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Request USB Permission
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleListUsbDevices}
                    disabled={isListingDevices}
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                  >
                    {isListingDevices ? 'Scanning...' : 'List USB Devices (Debug)'}
                  </Button>

                  {usbDevices && (
                    <pre className="text-xs p-2 rounded bg-muted/50 overflow-x-auto whitespace-pre-wrap">
                      {usbDevices}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered Palms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered Palms</CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No palms registered yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/palm-register')}
                    className="mt-2"
                  >
                    Register your palm →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <div 
                      key={reg.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium capitalize">{reg.palmHand} Hand</p>
                        <p className="text-xs text-muted-foreground">
                          Registered {reg.registeredAt.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        reg.status === 'active' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Guide Link */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Need to set up the Windows server?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Follow our C# server setup guide to connect your palm vein scanner.
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="px-0 mt-2 h-auto"
                    onClick={() => navigate('/server')}
                  >
                    View Server Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HardwareSettingsPage;
