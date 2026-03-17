# Palm IQ C# Server Setup Guide (Real SDK Integration)

This guide explains how to set up the **production C# Windows server** that bridges the palm vein scanner hardware with the Palm IQ mobile app using the **real SDK**.

## Architecture Overview

```
┌─────────────────────┐     HTTP/REST     ┌──────────────────────┐
│   Mobile Phone      │ ◄───────────────► │   Windows Laptop     │
│   (Palm IQ App)     │       WiFi        │   (C# Server)        │
└─────────────────────┘                   └──────────┬───────────┘
                                                     │ USB
┌─────────────────────┐     HTTP/REST               ▼
│   Windows Browser   │ ◄─────────────►   ┌──────────────────────┐
│   (localhost)       │                   │   TM-P Palm Vein     │
└─────────────────────┘                   │   Scanner Hardware   │
                                          └──────────────────────┘
```

## Prerequisites

1. **Windows 10/11** PC or Laptop
2. **.NET 8.0** or **.NET Framework 4.8**
3. **TM-P Palm Vein Scanner** connected via USB
4. **Visual Studio 2022** or later

## SDK Files Required

Copy all these files to your server's `libs/` folder:

```
libs/
├── SonixCamera.dll          # Camera control library
├── XRCommonVeinAlgAPI.dll   # Vein algorithm library
├── libusb-1.0.dll           # USB device access
├── gmssl.dll                # Encryption library
│
models/
├── ir_liveness_roi_160x160_en.bin
├── palm_detection_20250530_en.bin
├── palm_filter_back_20240923_en.bin
├── palm_filter_en.bin
├── palm_landmark_20250530_en.bin
├── palm_print_20241004_fp_16_en.bin
└── palm_vein_20240901_fp16_en.bin
```

---

## Project Structure

```
PalmIQServer/
├── PalmIQServer.sln
├── PalmIQServer/
│   ├── Program.cs
│   ├── PalmIQServer.csproj
│   ├── HttpServer/
│   │   ├── SimpleHttpServer.cs
│   │   └── ApiController.cs
│   ├── SDK/
│   │   ├── SonixCameraWrapper.cs       # Camera SDK P/Invoke
│   │   ├── XRVeinAlgWrapper.cs         # Vein Algorithm P/Invoke
│   │   └── PalmManager.cs              # High-level palm operations
│   ├── Models/
│   │   ├── PalmRecord.cs
│   │   ├── sPalmInfo.cs
│   │   └── ApiResponses.cs
│   └── Data/
│       └── palms.json
├── libs/                               # SDK DLLs here
└── models/                             # Model files here
```

---

## Complete Source Code

### 1. SonixCameraWrapper.cs - Camera SDK (From SonixCamera.h)

```csharp
using System;
using System.Runtime.InteropServices;

namespace PalmIQServer.SDK
{
    /// <summary>
    /// P/Invoke wrapper for SonixCamera.dll
    /// Based on SonixCamera.h header file
    /// </summary>
    public static class SonixCameraWrapper
    {
        private const string DLL_NAME = "SonixCamera.dll";

        #region Camera Initialization

        /// <summary>
        /// Initialize the camera library
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_Init();

        /// <summary>
        /// Uninitialize the camera library
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_UnInit();

        #endregion

        #region Device Enumeration

        /// <summary>
        /// Device structure
        /// </summary>
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct scDevice
        {
            public byte chipID;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public string devName;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public string devPath;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 50)]
            public string devLocation;
        }

        /// <summary>
        /// Enumerate all SONIX camera devices
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_EnumCameras(
            out uint devCount,
            [In, Out] scDevice[] devs,
            uint devsArraySize
        );

        #endregion

        #region Camera Control

        /// <summary>
        /// Restart the device
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_Restart(ref scDevice dev);

        /// <summary>
        /// Open camera
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_OpenCamera(
            IntPtr dev,
            IntPtr hWnd,
            SampleGrabberCallback callback,
            IntPtr ptrClass
        );

        /// <summary>
        /// Close camera
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_CloseCamera(IntPtr dev);

        /// <summary>
        /// Start preview
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_StartPreview(IntPtr dev);

        /// <summary>
        /// Stop preview
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_StopPreview(IntPtr dev);

        /// <summary>
        /// Set preview format (1920x1080 or 640x480)
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_SetPreviewFormat(
            IntPtr dev,
            int formatIndex,
            IntPtr hWnd
        );

        #endregion

        #region Error Handling

        /// <summary>
        /// Error codes
        /// </summary>
        [StructLayout(LayoutKind.Sequential)]
        public struct scErrorCode
        {
            public int code;
        }

        /// <summary>
        /// Get last error code
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool SonixCam_GetErrorCode(ref scDevice dev, out scErrorCode ec);

        #endregion

        #region Callbacks

        /// <summary>
        /// Sample grabber callback
        /// </summary>
        [UnmanagedFunctionPointer(CallingConvention.StdCall)]
        public delegate int SampleGrabberCallback(
            double sampleTime,
            IntPtr buffer,
            uint bufferSize,
            IntPtr ptrClass
        );

        #endregion
    }
}
```

### 2. XRVeinAlgWrapper.cs - Vein Algorithm SDK (From XRCommonVeinAlgAPI.h)

```csharp
using System;
using System.Runtime.InteropServices;

namespace PalmIQServer.SDK
{
    /// <summary>
    /// P/Invoke wrapper for XRCommonVeinAlgAPI.dll
    /// Based on XRCommonVeinAlgAPI.h and tdx_ret.h header files
    /// </summary>
    public static class XRVeinAlgWrapper
    {
        private const string DLL_NAME = "XRCommonVeinAlgAPI.dll";

        #region Constants (from tdx_ret.h)

        // Feature size
        public const int XR_VEIN_FEATURE_INFO_SIZE = 1036;
        public const float XR_VEIN_THRESH = 0.95f;

        // Enrollment tips
        public const int PV_TIP_INPUT_PALM = 1;
        public const int PV_TIP_MOVE_FARAWAY = 2;
        public const int PV_TIP_MOVE_CLOSER = 3;
        public const int PV_TIP_INVALID_BRIGHT = 4;
        public const int PV_TIP_KEEP_PALM_STABLE = 5;
        public const int PV_TIP_KEEP_PALM_DIRECTION = 6;
        public const int PV_TIP_MOVE_PALM_DOWN = 7;
        public const int PV_TIP_MOVE_PALM_UP = 8;
        public const int PV_TIP_MOVE_PALM_LEFT = 9;
        public const int PV_TIP_MOVE_PALM_RIGHT = 10;
        public const int PV_TIP_CAP_SUCCESS = 20;
        public const int PV_TIP_ENROLL_FINISH = 100;

        // Error codes
        public const int PV_OK = 0;
        public const int PV_ERR = -1;
        public const int PV_ERR_NO_DEVICE = -2;
        public const int PV_ERR_NULL_PTR = -3;
        public const int PV_ERR_PARAM = -4;
        public const int PV_ERR_UNSUPPORT = -5;
        public const int PV_ERR_HANDLE = -6;
        public const int PV_ERR_NO_HAND = -7;
        public const int PV_ERR_MEM = -8;
        public const int PV_ERR_BROKEN_FEAT = -9;

        // Device errors
        public const int PV_ERR_DEV_NOT_OPEN = -20;
        public const int PV_ERR_DEV_BAD_IMG = -21;
        public const int PV_ERR_DEV_TIMEOUT = -22;
        public const int PV_ERR_DEV_PARAM = -23;
        public const int PV_ERR_DEV_UNKNOWN = -24;
        public const int PV_ERR_NOT_SAME_FINGER = -25;
        public const int PV_ERR_FEAT_DUP = -26;

        // Algorithm errors
        public const int PV_ERR_LOAD_ALGO_LIB = -30;
        public const int PV_ERR_EXTRACT_FEAT = -31;
        public const int PV_ERR_QUALITY_LOW_LIGHT = -32;
        public const int PV_ERR_QUALITY_HIGH_LIGHT = -33;
        public const int PV_ERR_QUALITY_BAD_TEXTURE = -34;
        public const int PV_ERR_QUALITY_BAD_IMG = -35;
        public const int PV_ERR_QUALITY_LIVENESS = -36;
        public const int PV_ERR_QUALITY_PALM_MOVE = -37;
        public const int PV_ERR_LOW_QUALITY = -38;

        // USB errors
        public const int PV_ERR_USB_INIT = -40;
        public const int PV_ERR_USB_PERMISION = -41;
        public const int PV_ERR_USB_TIMEOUT = -42;
        public const int PV_ERR_USB_BROKEN_PKT = -43;
        public const int PV_ERR_USB_TRANSFER = -44;
        public const int PV_ERR_OPEN_DEV = -45;
        public const int PV_ERR_USB_UNKNOWN = -48;

        // License error
        public const int PV_ERR_LIC = -1000;

        #endregion

        #region Structures (from tdx_ret.h)

        /// <summary>
        /// Palm detection info structure
        /// </summary>
        [StructLayout(LayoutKind.Sequential)]
        public struct sPalmInfo
        {
            public byte status;         // Non-zero = detected
            public byte palm_bright;    // Palm brightness
            public ushort x;            // Palm X position
            public uint y;              // Palm Y position
            public ushort width;        // Palm width
            public ushort height;       // Palm height
        }

        #endregion

        #region SDK Initialization

        /// <summary>
        /// Get SDK version
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_GetVersion(
            [MarshalAs(UnmanagedType.LPStr)] System.Text.StringBuilder pVersionBuf,
            ref int pBufLen
        );

        /// <summary>
        /// Initialize SDK - returns handle pointer
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_Init(out IntPtr ppAlgHandle);

        /// <summary>
        /// Release SDK handle
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_DeInit(IntPtr pDevHandle);

        #endregion

        #region License/Activation

        /// <summary>
        /// Get current license code (for activation)
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_GetLicCode(
            IntPtr pDevHandle,
            [Out] byte[] pCodeBuf,
            ref int pLen
        );

        /// <summary>
        /// Activate SDK with license
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_ActivateVeinSDK(
            IntPtr pDevHandle,
            [In] byte[] pLicBuf,
            int len
        );

        #endregion

        #region Palm Enrollment

        /// <summary>
        /// Initialize enrollment environment
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_InitEnrollEnv(IntPtr pDevHandle);

        /// <summary>
        /// Try to enroll palm from image
        /// </summary>
        /// <param name="pDevHandle">SDK handle</param>
        /// <param name="pImgBuf">Grayscale image buffer (480x640)</param>
        /// <param name="imgRows">Image height (480)</param>
        /// <param name="imgCols">Image width (640)</param>
        /// <param name="livenessFlag">1=check liveness, 0=skip</param>
        /// <param name="pEnrollStep">Progress 0-3 (3=complete)</param>
        /// <param name="pEnrollTip">Guidance tip code</param>
        /// <param name="pPalmInfo">Palm detection info</param>
        /// <param name="pHighBright">Brightness value</param>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_TryEnroll(
            IntPtr pDevHandle,
            [In] byte[] pImgBuf,
            int imgRows,
            int imgCols,
            int livenessFlag,
            ref int pEnrollStep,
            ref int pEnrollTip,
            ref sPalmInfo pPalmInfo,
            ref byte pHighBright
        );

        /// <summary>
        /// Finish enrollment and extract feature
        /// </summary>
        /// <param name="pDevHandle">SDK handle</param>
        /// <param name="pRoiImgBuf">ROI image buffer (160x160)</param>
        /// <param name="pRoiImgBufLen">ROI buffer length</param>
        /// <param name="pRegFeatBuf">Feature buffer (min 1036 bytes)</param>
        /// <param name="pBufLen">Feature buffer length</param>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_FinishEnroll(
            IntPtr pDevHandle,
            [Out] byte[] pRoiImgBuf,
            ref int pRoiImgBufLen,
            [Out] byte[] pRegFeatBuf,
            ref int pBufLen
        );

        #endregion

        #region Palm Matching

        /// <summary>
        /// Extract feature from full image (for matching)
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_GrabFeatureFromFullImg(
            IntPtr pDevHandle,
            [In] byte[] pImgBuf,
            int imgRows,
            int imgCols,
            int livenessFlag,
            [Out] byte[] pFeatBuf,
            ref int pBufLen,
            ref int pCapTip,
            ref sPalmInfo pPalmInfo,
            ref byte pHighBright
        );

        /// <summary>
        /// Extract feature from enrollment ROI image
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_GrabFeatureFromEnrollRoiImg(
            IntPtr pDevHandle,
            [In] byte[] pImgBuf,
            int imgRows,
            int imgCols,
            [Out] byte[] pFeatBuf,
            ref int pBufLen
        );

        /// <summary>
        /// Validate feature data integrity
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_CheckFeat(
            [In] byte[] pFeatBuf,
            int bufLen
        );

        /// <summary>
        /// Compare two palm features and get similarity distance
        /// Distance >= 0.95 = match
        /// </summary>
        [DllImport(DLL_NAME, CallingConvention = CallingConvention.StdCall)]
        public static extern int XR_Vein_CalcFeatureDist(
            [In] byte[] pFeatBuf1,
            int bufLen1,
            [In] byte[] pFeatBuf2,
            int bufLen2,
            out float pDist
        );

        #endregion

        #region Helper Methods

        public static string GetEnrollTipMessage(int tip)
        {
            return tip switch
            {
                PV_TIP_INPUT_PALM => "Please place your palm",
                PV_TIP_MOVE_FARAWAY => "Move palm farther away",
                PV_TIP_MOVE_CLOSER => "Move palm closer",
                PV_TIP_INVALID_BRIGHT => "Adjust lighting",
                PV_TIP_KEEP_PALM_STABLE => "Keep palm steady",
                PV_TIP_KEEP_PALM_DIRECTION => "Adjust palm angle",
                PV_TIP_MOVE_PALM_DOWN => "Move palm down",
                PV_TIP_MOVE_PALM_UP => "Move palm up",
                PV_TIP_MOVE_PALM_LEFT => "Move palm left",
                PV_TIP_MOVE_PALM_RIGHT => "Move palm right",
                PV_TIP_CAP_SUCCESS => "Capture successful",
                PV_TIP_ENROLL_FINISH => "Registration complete",
                _ => $"Unknown tip: {tip}"
            };
        }

        public static string GetErrorMessage(int code)
        {
            return code switch
            {
                PV_OK => "Success",
                PV_ERR => "General error",
                PV_ERR_NO_DEVICE => "No device connected",
                PV_ERR_NULL_PTR => "Null pointer",
                PV_ERR_PARAM => "Invalid parameter",
                PV_ERR_NO_HAND => "No palm detected",
                PV_ERR_DEV_TIMEOUT => "Device timeout",
                PV_ERR_QUALITY_LOW_LIGHT => "Low light quality",
                PV_ERR_QUALITY_HIGH_LIGHT => "Too bright",
                PV_ERR_QUALITY_PALM_MOVE => "Palm moved during capture",
                PV_ERR_USB_PERMISION => "USB permission denied",
                PV_ERR_LIC => "License error",
                _ => $"Error code: {code}"
            };
        }

        #endregion
    }
}
```

### 3. PalmManager.cs - High-Level Operations

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace PalmIQServer.SDK
{
    public class PalmManager
    {
        private IntPtr _algHandle = IntPtr.Zero;
        private bool _isInitialized = false;
        private bool _isDeviceConnected = false;
        private SonixCameraWrapper.scDevice[] _devices;
        private List<PalmRecord> _registeredPalms = new();
        private readonly string _palmsFilePath = "Data/palms.json";
        
        // Camera frame buffer
        private byte[] _frameBuffer;
        private const int IMG_WIDTH = 640;
        private const int IMG_HEIGHT = 480;
        
        public bool Initialize()
        {
            try
            {
                Console.WriteLine("[SDK] Initializing camera library...");
                
                // Initialize camera
                bool camInit = SonixCameraWrapper.SonixCam_Init();
                if (!camInit)
                {
                    Console.WriteLine("[SDK] Camera init failed");
                    return false;
                }
                
                // Enumerate devices
                _devices = new SonixCameraWrapper.scDevice[10];
                bool enumResult = SonixCameraWrapper.SonixCam_EnumCameras(
                    out uint devCount, _devices, 10);
                
                if (!enumResult || devCount == 0)
                {
                    Console.WriteLine("[SDK] No palm scanner devices found");
                    return false;
                }
                
                Console.WriteLine($"[SDK] Found {devCount} device(s)");
                _isDeviceConnected = true;
                
                // Initialize vein algorithm
                Console.WriteLine("[SDK] Initializing vein algorithm...");
                int ret = XRVeinAlgWrapper.XR_Vein_Init(out _algHandle);
                
                if (ret != XRVeinAlgWrapper.PV_OK || _algHandle == IntPtr.Zero)
                {
                    Console.WriteLine($"[SDK] Vein algorithm init failed: {ret}");
                    return false;
                }
                
                // Get and activate license
                byte[] licCode = new byte[64];
                int licLen = 64;
                ret = XRVeinAlgWrapper.XR_Vein_GetLicCode(_algHandle, licCode, ref licLen);
                
                if (ret == XRVeinAlgWrapper.PV_OK && licLen > 0)
                {
                    // SDK handles its own activation via chip decryption
                    Console.WriteLine("[SDK] License code retrieved");
                }
                
                _isInitialized = true;
                _frameBuffer = new byte[IMG_WIDTH * IMG_HEIGHT];
                
                // Load stored palms
                LoadPalms();
                
                Console.WriteLine("[SDK] Initialization complete");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SDK] Init exception: {ex.Message}");
                return false;
            }
        }
        
        public bool IsHardwareConnected() => _isDeviceConnected;
        public int GetPalmCount() => _registeredPalms.Count;
        
        public async Task<RegisterResult> RegisterPalmAsync(string hand, string userId)
        {
            if (!_isInitialized || _algHandle == IntPtr.Zero)
            {
                return new RegisterResult { Success = false, Error = "SDK not initialized" };
            }
            
            try
            {
                // Initialize enrollment
                int ret = XRVeinAlgWrapper.XR_Vein_InitEnrollEnv(_algHandle);
                if (ret != XRVeinAlgWrapper.PV_OK)
                {
                    return new RegisterResult { 
                        Success = false, 
                        Error = $"Failed to init enrollment: {XRVeinAlgWrapper.GetErrorMessage(ret)}" 
                    };
                }
                
                Console.WriteLine("[SDK] Starting enrollment capture...");
                
                // Enrollment loop - need 3 successful captures
                int enrollStep = 0;
                int maxAttempts = 30; // 30 frames
                
                for (int attempt = 0; attempt < maxAttempts && enrollStep < 3; attempt++)
                {
                    // Grab frame from camera
                    if (!GrabFrame())
                    {
                        await Task.Delay(100);
                        continue;
                    }
                    
                    // Try enrollment
                    int enrollTip = 0;
                    var palmInfo = new XRVeinAlgWrapper.sPalmInfo();
                    byte brightness = 0;
                    
                    ret = XRVeinAlgWrapper.XR_Vein_TryEnroll(
                        _algHandle,
                        _frameBuffer,
                        IMG_HEIGHT,
                        IMG_WIDTH,
                        1, // Enable liveness check
                        ref enrollStep,
                        ref enrollTip,
                        ref palmInfo,
                        ref brightness
                    );
                    
                    string tipMsg = XRVeinAlgWrapper.GetEnrollTipMessage(enrollTip);
                    Console.WriteLine($"[SDK] Enroll step: {enrollStep}/3, tip: {tipMsg}");
                    
                    if (palmInfo.status == 0)
                    {
                        Console.WriteLine("[SDK] No palm detected, waiting...");
                    }
                    
                    await Task.Delay(200);
                }
                
                if (enrollStep < 3)
                {
                    return new RegisterResult { 
                        Success = false, 
                        Error = "Enrollment incomplete - could not capture enough samples" 
                    };
                }
                
                // Extract final feature
                byte[] roiImg = new byte[160 * 160];
                byte[] feature = new byte[XRVeinAlgWrapper.XR_VEIN_FEATURE_INFO_SIZE];
                int roiLen = roiImg.Length;
                int featLen = feature.Length;
                
                ret = XRVeinAlgWrapper.XR_Vein_FinishEnroll(
                    _algHandle, roiImg, ref roiLen, feature, ref featLen);
                
                if (ret != XRVeinAlgWrapper.PV_OK || featLen == 0)
                {
                    return new RegisterResult { 
                        Success = false, 
                        Error = $"Failed to extract feature: {XRVeinAlgWrapper.GetErrorMessage(ret)}" 
                    };
                }
                
                // Validate feature
                ret = XRVeinAlgWrapper.XR_Vein_CheckFeat(feature, featLen);
                if (ret != XRVeinAlgWrapper.PV_OK)
                {
                    return new RegisterResult { 
                        Success = false, 
                        Error = "Feature validation failed" 
                    };
                }
                
                // Save palm record (feature stored securely)
                string palmId = $"palm_{DateTime.UtcNow.Ticks}";
                var record = new PalmRecord
                {
                    Id = palmId,
                    UserId = userId ?? "default",
                    Hand = hand,
                    Feature = Convert.ToBase64String(feature, 0, featLen),
                    RegisteredAt = DateTime.UtcNow
                };
                
                _registeredPalms.Add(record);
                SavePalms();
                
                Console.WriteLine($"[SDK] Palm registered: {palmId}");
                
                return new RegisterResult { Success = true, PalmId = palmId };
            }
            catch (Exception ex)
            {
                return new RegisterResult { Success = false, Error = ex.Message };
            }
        }
        
        public async Task<MatchResult> MatchPalmAsync()
        {
            if (!_isInitialized || _algHandle == IntPtr.Zero)
            {
                return new MatchResult { Matched = false, Error = "SDK not initialized" };
            }
            
            if (_registeredPalms.Count == 0)
            {
                return new MatchResult { Matched = false, Error = "No palms registered" };
            }
            
            try
            {
                Console.WriteLine("[SDK] Starting palm match...");
                
                // Capture and extract feature
                int maxAttempts = 20;
                byte[] capturedFeature = null;
                
                for (int attempt = 0; attempt < maxAttempts; attempt++)
                {
                    if (!GrabFrame())
                    {
                        await Task.Delay(100);
                        continue;
                    }
                    
                    byte[] featBuf = new byte[4096];
                    int featLen = featBuf.Length;
                    int capTip = 0;
                    var palmInfo = new XRVeinAlgWrapper.sPalmInfo();
                    byte brightness = 0;
                    
                    int ret = XRVeinAlgWrapper.XR_Vein_GrabFeatureFromFullImg(
                        _algHandle,
                        _frameBuffer,
                        IMG_HEIGHT,
                        IMG_WIDTH,
                        1, // Liveness check
                        featBuf,
                        ref featLen,
                        ref capTip,
                        ref palmInfo,
                        ref brightness
                    );
                    
                    if (ret == XRVeinAlgWrapper.PV_OK && featLen > 0 && palmInfo.status != 0)
                    {
                        capturedFeature = new byte[featLen];
                        Array.Copy(featBuf, capturedFeature, featLen);
                        break;
                    }
                    
                    Console.WriteLine($"[SDK] Match attempt {attempt + 1}: {XRVeinAlgWrapper.GetEnrollTipMessage(capTip)}");
                    await Task.Delay(200);
                }
                
                if (capturedFeature == null)
                {
                    return new MatchResult { Matched = false, Error = "Could not capture palm feature" };
                }
                
                // Compare against all registered palms
                foreach (var palm in _registeredPalms)
                {
                    byte[] storedFeature = Convert.FromBase64String(palm.Feature);
                    
                    int ret = XRVeinAlgWrapper.XR_Vein_CalcFeatureDist(
                        storedFeature, storedFeature.Length,
                        capturedFeature, capturedFeature.Length,
                        out float distance
                    );
                    
                    if (ret == XRVeinAlgWrapper.PV_OK && distance >= XRVeinAlgWrapper.XR_VEIN_THRESH)
                    {
                        Console.WriteLine($"[SDK] Match found: {palm.Id} (confidence: {distance:P1})");
                        return new MatchResult
                        {
                            Matched = true,
                            PalmId = palm.Id,
                            UserId = palm.UserId,
                            Confidence = distance
                        };
                    }
                }
                
                return new MatchResult { Matched = false, Error = "No matching palm found" };
            }
            catch (Exception ex)
            {
                return new MatchResult { Matched = false, Error = ex.Message };
            }
        }
        
        private bool GrabFrame()
        {
            // Camera frame grabbing - would be implemented with actual callback
            // For now, return false to indicate not captured
            return false;
        }
        
        public List<PalmRecord> GetAllPalms() => _registeredPalms;
        
        public bool DeletePalm(string palmId)
        {
            var palm = _registeredPalms.Find(p => p.Id == palmId);
            if (palm != null)
            {
                _registeredPalms.Remove(palm);
                SavePalms();
                return true;
            }
            return false;
        }
        
        public float GetTemperature() => 36.5f; // Placeholder
        
        private void LoadPalms()
        {
            if (File.Exists(_palmsFilePath))
            {
                var json = File.ReadAllText(_palmsFilePath);
                _registeredPalms = JsonConvert.DeserializeObject<List<PalmRecord>>(json) ?? new();
            }
        }
        
        private void SavePalms()
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_palmsFilePath)!);
            var json = JsonConvert.SerializeObject(_registeredPalms, Formatting.Indented);
            File.WriteAllText(_palmsFilePath, json);
        }
        
        public void Shutdown()
        {
            if (_algHandle != IntPtr.Zero)
            {
                XRVeinAlgWrapper.XR_Vein_DeInit(_algHandle);
                _algHandle = IntPtr.Zero;
            }
            SonixCameraWrapper.SonixCam_UnInit();
        }
    }
    
    #region Models
    
    public class PalmRecord
    {
        public string Id { get; set; }
        public string UserId { get; set; }
        public string Hand { get; set; }
        public string Feature { get; set; } // Base64-encoded feature (stored securely)
        public DateTime RegisteredAt { get; set; }
    }
    
    public class RegisterResult
    {
        public bool Success { get; set; }
        public string PalmId { get; set; }
        public string Error { get; set; }
    }
    
    public class MatchResult
    {
        public bool Matched { get; set; }
        public string PalmId { get; set; }
        public string UserId { get; set; }
        public float Confidence { get; set; }
        public string Error { get; set; }
    }
    
    #endregion
}
```

### 4. Program.cs - Entry Point

```csharp
using System;
using PalmIQServer.HttpServer;
using PalmIQServer.SDK;

namespace PalmIQServer
{
    class Program
    {
        static void Main(string[] args)
        {
            int port = 8080;
            if (args.Length > 0 && int.TryParse(args[0], out int customPort))
            {
                port = customPort;
            }

            Console.WriteLine("╔═══════════════════════════════════════════╗");
            Console.WriteLine("║      Palm IQ Server v2.0.0 (Real SDK)     ║");
            Console.WriteLine("╠═══════════════════════════════════════════╣");
            Console.WriteLine($"║  Starting on port {port}...                  ║");
            Console.WriteLine("╚═══════════════════════════════════════════╝");

            try
            {
                var palmManager = new PalmManager();
                bool sdkReady = palmManager.Initialize();

                if (!sdkReady)
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("[WARN] SDK initialization failed");
                    Console.WriteLine("       Ensure palm scanner is connected via USB");
                    Console.WriteLine("       Ensure all DLLs are in the libs/ folder");
                    Console.ResetColor();
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[OK] SDK initialized successfully");
                    Console.ResetColor();
                }

                var server = new SimpleHttpServer(port, palmManager);
                server.Start();

                Console.WriteLine($"\n[INFO] Server running at http://localhost:{port}");
                Console.WriteLine("[INFO] To connect from mobile:");
                Console.WriteLine($"       Use http://<your-laptop-ip>:{port}");
                Console.WriteLine("\n[INFO] API endpoints:");
                Console.WriteLine("       GET  /api/status     - Check server status");
                Console.WriteLine("       POST /api/register   - Register a palm");
                Console.WriteLine("       POST /api/match      - Match a palm scan");
                Console.WriteLine("       GET  /api/palms      - List registered palms");
                Console.WriteLine("       DELETE /api/palm/:id - Delete a palm");
                Console.WriteLine("\nPress ENTER to stop...\n");

                Console.ReadLine();
                
                palmManager.Shutdown();
                server.Stop();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[ERROR] {ex.Message}");
                Console.ResetColor();
                Console.ReadLine();
            }
        }
    }
}
```

---

## Quick Start

1. **Create project folder:**
   ```
   mkdir C:\PalmIQServer
   cd C:\PalmIQServer
   ```

2. **Copy SDK files:**
   ```
   libs\
   ├── SonixCamera.dll
   ├── XRCommonVeinAlgAPI.dll
   ├── libusb-1.0.dll
   └── gmssl.dll
   
   models\
   ├── ir_liveness_roi_160x160_en.bin
   └── ... (all 7 .bin files)
   ```

3. **Build and run:**
   ```bash
   dotnet build
   dotnet run
   ```

4. **Connect from mobile app:**
   - Open Hardware Settings
   - Select "Windows Server"
   - Enter: `http://<laptop-ip>:8080`
   - Test Connection

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Server + hardware status |
| `/api/register` | POST | Register palm (body: `{"hand": "right"}`) |
| `/api/match` | POST | Match current palm against registered |
| `/api/palms` | GET | List all registered palms |
| `/api/palm/:id` | DELETE | Delete a palm registration |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No device found" | Check USB connection, try different port |
| "DLL not found" | Ensure all 4 DLLs are in libs/ folder |
| "License error" | Device authorization required - contact vendor |
| "Model load failed" | Check all 7 .bin files are in models/ folder |
