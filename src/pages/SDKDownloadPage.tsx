import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  FileCode, 
  FolderOpen,
  Github,
  Package,
  Cpu,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SDKDownloadPage = () => {
  const androidFiles = [
    { name: "palm_detection_20250530_en.bin", size: "~15MB", desc: "Palm detection model" },
    { name: "palm_landmark_20250530_en.bin", size: "~8MB", desc: "Landmark detection" },
    { name: "palm_vein_20240901_fp16_en.bin", size: "~12MB", desc: "Vein recognition" },
    { name: "palm_print_20241004_fp_16_en.bin", size: "~10MB", desc: "Print recognition" },
    { name: "palm_filter_en.bin", size: "~2MB", desc: "Palm filter" },
    { name: "palm_filter_back_20240923_en.bin", size: "~2MB", desc: "Background filter" },
    { name: "ir_liveness_roi_160x160_en.bin", size: "~5MB", desc: "Liveness detection" },
  ];

  const nativeLibs = [
    { name: "libpalm_sdk.so", desc: "Main Palm SDK" },
    { name: "libncnn.so", desc: "Neural network inference" },
    { name: "libopencv_java3.so", desc: "OpenCV image processing" },
    { name: "libusb1.0.so", desc: "USB device access" },
    { name: "libcrypto.so", desc: "Cryptography" },
    { name: "libgmssl.so", desc: "GM SSL" },
    { name: "libssl.so", desc: "SSL/TLS" },
    { name: "libomp.so", desc: "OpenMP threading" },
    { name: "librknntt.so", desc: "Rockchip NPU" },
  ];

  const windowsDlls = [
    { name: "SonixCamera.dll", desc: "Camera control" },
    { name: "XRCommonVeinAlgAPI.dll", desc: "Vein algorithm API" },
    { name: "gmssl.dll", desc: "GM SSL encryption" },
    { name: "libusb-1.0.dll", desc: "USB device access" },
  ];

  const javaClasses = [
    "XRCommonVeinAlgAPI.java",
    "VeinProcessor.java", 
    "SonixCamera.java",
    "SonixCameraManager.java",
    "sPalmInfo.java",
    "VeinReturnCode.java",
    "VeinException.java",
    "EnrollTip.java",
  ];

  return (
    <MobileLayout title="SDK Downloads" showBack>
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Palm IQ SDK Package</h1>
          <p className="text-sm text-muted-foreground">
            Complete hardware integration files for Android & Windows
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="w-5 h-5" />
              How to Download
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <span>Click <strong>"Export to GitHub"</strong> from the editor</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <span>Clone your repository locally</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <span>SDK files are in <code className="bg-muted px-1 rounded">android-sdk-files/</code></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Contents */}
        <Accordion type="single" collapsible className="space-y-2">
          {/* Android SDK */}
          <AccordionItem value="android" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Android SDK</p>
                  <p className="text-xs text-muted-foreground">Native Capacitor integration</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Model Files */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Model Files (assets/)
                </h4>
                <div className="space-y-1">
                  {androidFiles.map((file) => (
                    <div key={file.name} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <span className="font-mono">{file.name}</span>
                      <span className="text-muted-foreground">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Native Libraries */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" /> Native Libraries (jniLibs/)
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {nativeLibs.map((lib) => (
                    <div key={lib.name} className="text-xs bg-muted/50 p-2 rounded">
                      <span className="font-mono">{lib.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available for: arm64-v8a, armeabi-v7a
                </p>
              </div>

              {/* Setup Path */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-1">📁 Copy to Android Project:</p>
                <code className="text-xs block">android/app/src/main/assets/</code>
                <code className="text-xs block">android/app/src/main/jniLibs/</code>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Windows SDK */}
          <AccordionItem value="windows" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Windows SDK</p>
                  <p className="text-xs text-muted-foreground">C# Server bridge</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* DLLs */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> DLL Files (windows-dlls/)
                </h4>
                <div className="space-y-1">
                  {windowsDlls.map((dll) => (
                    <div key={dll.name} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <span className="font-mono">{dll.name}</span>
                      <span className="text-muted-foreground">{dll.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Setup Path */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-1">📁 Copy to C# Server:</p>
                <code className="text-xs block">PalmVeinServer/libs/</code>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Java Source */}
          <AccordionItem value="java" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Java Source</p>
                  <p className="text-xs text-muted-foreground">SDK interface classes</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-1">
                {javaClasses.map((cls) => (
                  <div key={cls} className="text-xs bg-muted/50 p-2 rounded font-mono">
                    {cls}
                  </div>
                ))}
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-1">📁 Location:</p>
                <code className="text-xs">android-sdk-files/java-classes/</code>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Documentation */}
          <AccordionItem value="docs" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Documentation</p>
                  <p className="text-xs text-muted-foreground">Setup guides & API docs</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>PALM_SDK_INTEGRATION_GUIDE.md</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>CSHARP_SERVER_GUIDE.md</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>ANDROID_SDK_SETUP.md</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>android-setup.md</span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Palm_vein_sdk_documentation_Java.pdf</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* File Structure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Repository Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`android-sdk-files/
├── assets/           # 7 NN model files
├── jniLibs/
│   ├── arm64-v8a/    # 9 native libs
│   └── armeabi-v7a/  # 9 native libs
├── libs/             # Java SDK JARs
├── windows-dlls/     # 4 Windows DLLs
├── java-classes/     # 8 Java sources
├── headers/          # C header files
├── docs/             # Official docs
└── config/           # AndroidManifest

src/sdk/
├── PalmVeinSDK.zip.001-004
└── PalmIQ_Hardware_Integration_Package.zip`}
            </pre>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => window.open('https://github.com', '_blank')}
        >
          <Github className="w-5 h-5 mr-2" />
          Export to GitHub to Download
        </Button>
      </div>
    </MobileLayout>
  );
};

export default SDKDownloadPage;
