import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Wifi, WifiOff, Server, Activity, Users, ThermometerSun, 
  CheckCircle2, XCircle, RefreshCw, Terminal, Copy, CheckCircle, Download,
  ExternalLink, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { palmServerApi } from '@/lib/palmServerApi';
import { usePalm } from '@/contexts/PalmContext';
import { useToast } from '@/hooks/use-toast';

interface ServerLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const WindowsServerPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { serverUrl, setServerUrl, connectionMode, setConnectionMode } = usePalm();
  
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [serverVersion, setServerVersion] = useState('unknown');
  const [registeredPalms, setRegisteredPalms] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const addLog = (type: ServerLog['type'], message: string) => {
    const newLog: ServerLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date(),
      type,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const checkServerStatus = async () => {
    setIsChecking(true);
    addLog('info', 'Checking server status...');
    
    try {
      const status = await palmServerApi.getStatus();
      setIsServerOnline(status.online);
      setIsHardwareConnected(status.hardwareConnected);
      setServerVersion(status.serverVersion);
      setRegisteredPalms(status.registeredPalms);
      
      if (status.online) {
        addLog('success', `Connected to server v${status.serverVersion}`);
        if (status.hardwareConnected) {
          addLog('success', 'Palm vein scanner hardware detected');
        } else {
          addLog('warning', 'Hardware not connected to server');
        }
      } else {
        addLog('error', 'Server is offline');
      }
    } catch (error) {
      setIsServerOnline(false);
      setIsHardwareConnected(false);
      addLog('error', 'Could not connect to server. Is it running?');
    }
    
    setIsChecking(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    // Check status on mount
    checkServerStatus();
    
    // Auto-refresh every 10 seconds if online
    const interval = setInterval(() => {
      if (isServerOnline) {
        palmServerApi.getStatus().then(status => {
          setIsHardwareConnected(status.hardwareConnected);
          setRegisteredPalms(status.registeredPalms);
        }).catch(() => {
          setIsServerOnline(false);
        });
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isServerOnline]);

  const getLogColor = (type: ServerLog['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Palm IQ Server</h1>
              <p className="text-xs text-muted-foreground">C# Windows Hardware Bridge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isServerOnline ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            {/* Connection Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => {
                      setServerUrl(e.target.value);
                      palmServerApi.setServerUrl(e.target.value);
                    }}
                    placeholder="http://localhost:8080"
                    className="flex-1 px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm"
                  />
                  <Button onClick={checkServerStatus} disabled={isChecking}>
                    {isChecking ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                    {isServerOnline ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Server</p>
                      <p className="text-xs text-muted-foreground">
                        {isServerOnline ? `v${serverVersion}` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                    {isHardwareConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Scanner</p>
                      <p className="text-xs text-muted-foreground">
                        {isHardwareConnected ? 'Connected' : 'Not detected'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{registeredPalms}</p>
                  <p className="text-xs text-muted-foreground">Registered Palms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Server className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{isServerOnline ? 'Online' : 'Offline'}</p>
                  <p className="text-xs text-muted-foreground">Server Status</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{isHardwareConnected ? 'Ready' : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Hardware</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ThermometerSun className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">36.5°</p>
                  <p className="text-xs text-muted-foreground">Avg Temp</p>
                </CardContent>
              </Card>
            </div>

            {/* Connection Logs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Connection Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Click refresh to check server status
                      </p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex gap-2">
                          <span className="text-muted-foreground">
                            [{log.timestamp.toLocaleTimeString()}]
                          </span>
                          <span className={getLogColor(log.type)}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Guide Tab */}
          <TabsContent value="setup" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Setup</CardTitle>
                <CardDescription>Get Palm IQ running in 5 minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 rounded-lg border">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    <div className="flex-1">
                      <p className="font-medium">Download SDK Files</p>
                      <p className="text-sm text-muted-foreground">
                        Create folder <code className="bg-muted px-1 rounded">C:\PalmIQ\</code> and copy all SDK files
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    <div className="flex-1">
                      <p className="font-medium">Required Files</p>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        <code className="block bg-muted px-2 py-1 rounded text-xs">SonixCamera.dll, libusb-1.0.dll, gmssl.dll</code>
                        <code className="block bg-muted px-2 py-1 rounded text-xs">liveness_roi-3, reg_img-3.bin</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    <div className="flex-1">
                      <p className="font-medium">Connect Hardware</p>
                      <p className="text-sm text-muted-foreground">
                        Plug in TM-P palm vein scanner via USB
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 rounded-lg border">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
                    <div className="flex-1">
                      <p className="font-medium">Run Server</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded text-xs flex-1">PalmIQServer.exe 8080</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => copyToClipboard('PalmIQServer.exe 8080', 'cmd')}
                        >
                          {copied === 'cmd' ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Connect from Phone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  To connect from your phone, both devices must be on the same WiFi network.
                </p>
                
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Find your laptop's IP:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1">ipconfig | findstr /i "IPv4"</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => copyToClipboard('ipconfig | findstr /i "IPv4"', 'ipconfig')}
                    >
                      {copied === 'ipconfig' ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Use this URL in app:</p>
                  <code className="text-xs">http://[your-laptop-ip]:8080</code>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => navigate('/hardware-settings')}
                >
                  Configure in App Settings
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference Tab */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">REST API Endpoints</CardTitle>
                <CardDescription>Base URL: {serverUrl}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm font-mono">
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-bold">GET</span>
                      <span>/api/status</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Check server and hardware status</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs font-bold">POST</span>
                      <span>/api/register</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Register a new palm. Body: {`{hand: "left"|"right", userId?: string}`}</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs font-bold">POST</span>
                      <span>/api/match</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Match palm scan for payment verification</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-bold">GET</span>
                      <span>/api/palms</span>
                    </div>
                    <p className="text-xs text-muted-foreground">List all registered palms</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-xs font-bold">DELETE</span>
                      <span>/api/palm/:id</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Delete a registered palm by ID</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-xs font-bold">GET</span>
                      <span>/api/temperature</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Get current temperature from sensor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Example Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
{`// GET /api/status
{
  "online": true,
  "hardwareConnected": true,
  "serverVersion": "1.0.0",
  "registeredPalms": 3
}

// POST /api/match
{
  "matched": true,
  "palmId": "palm_1705567234567",
  "confidence": 0.92,
  "temperature": 36.5
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WindowsServerPage;
