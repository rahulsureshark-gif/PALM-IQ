
#ifndef  UTIL_H
#define  UTIL_H

#include <windows.h>


namespace SonixLib{


typedef unsigned char       uchar;
typedef unsigned short      ushort;
typedef unsigned int        uint;


#define SFCMD_RDID_MXIC_ALINK       0x9f
#define SFCMD_RDID_AT25F            0x15


#ifndef WinAPI
#define WinAPI	__stdcall
#endif


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	图像采样回调函数指针
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
*	CallBack:		SonixCam_SetProgress
*	Description:
*	Parameters:		buffer: 传递给回调函数，自定义数据结构指针或者类指针
*					bufferSize: 进度值(0 - 1)
*                   ptrClass: 
*/
typedef int(CALLBACK *SonixCam_SampleGrabberBuffer)(double sampleTime, uchar* buffer, uint bufferSize, void* ptrClass);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	烧录或导出进度回调函数指针
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
*	CallBack:		SonixCam_SetProgress
*	Description:
*	Parameters:		ptrClass: 传递给回调函数，自定义数据结构指针或者类指针
*					fProcess: 进度值(0 - 1)
*/
typedef void(CALLBACK *SonixCam_SetProgress)(void* ptrClass, float process);


typedef enum class scDeviceType_t{
    Video,
    Audio
}scDeviceType;


typedef enum class scParamType_t {
    VidPid,              // 4bytes
    BCD,                 // 2bytes
    Product,             // <= 31bytes
    Manufacturer,        // <= 31bytes
    SerialNumber,        // <= 31bytes
    String3,             // <= 31bytes
    Interface,           // <= 31bytes
}scParamType;


typedef struct scDevice_t
{
    uchar chipID;
    wchar_t devName[256];
    wchar_t devPath[256];
    wchar_t devLocation[50];
    scDevice_t() {
        chipID = 0;
        memset(devName, 0, sizeof(wchar_t) * 256);
        memset(devPath, 0, sizeof(wchar_t) * 256);
        memset(devLocation, 0, sizeof(wchar_t) * 50);
    }
}scDevice;


typedef struct scAudioDevice_t
{
    wchar_t devName[256];
    wchar_t serialNumber[256];
    scAudioDevice_t(){
        memset(devName, 0, sizeof(wchar_t) * 256);
        memset(serialNumber, 0, sizeof(wchar_t) * 256);
    }
}scAudioDevice;


typedef enum class scErrorCode_t
{
    ecUnknow,
    ecCoInitializeEx,
    ecLibInitFail,
    ecEnumDeviceFail,
    ecNotFindDevice,
    ecGetKsControlFail,
    ecMemoryMallocFail,
    ecDeviceDisconnect,
    ecSyncTransTimeOut,
    ecBurnCheckFail,
    ecSectorEraseFail,
    ecBlockEraseFail,
    ecWriteFlashFail,
    ecChipEraseFail,
    ecWriteFlashCheckFail,
    ecGetParamTabFail,
    ecGetChipArchTypeFail,
    ecGetChipRomVersionFail,
    ecDisableWriteProtectFail,
}scErrorCode;


typedef struct scDevDescriptor_t
{
    char* vidpidBuf;
    char* productBuf;
    char* manufactureBuf;
    char* serialNumberBuf;
    char* string3Buf;
    char* interfaceBuf;

    uchar vidpidBytes;
    uchar productBytes;
    uchar manufactureBytes;
    uchar serialNumberBytes;
    uchar string3Bytes;
    uchar interfaceBytes;
    scDevDescriptor_t(){
        vidpidBuf = 0;
        productBuf = 0;
        manufactureBuf = 0;
        serialNumberBuf = 0;
        string3Buf = 0;
        interfaceBuf = 0;
        vidpidBytes = 0;
        productBytes = 0;
        manufactureBytes = 0;
        serialNumberBytes = 0;
        string3Bytes = 0;
        interfaceBytes = 0;
    }
}scDevDescriptor;


typedef enum class scVideoColorSpace_t
{
  Unknow,
  H264,
  Mjpg,
  Yuy2,
  Y8
}scVideoColorSpace;


typedef struct scVideoOutFormat_t
{
  uint width;
  uint height;
  scVideoColorSpace colorSpace;
	GUID mediaSubType;
}scVideoOutFormat;


typedef enum class audio_formattype_t
{
  AF_Unknow,
  AF_PMC,
  AF_WAVE,
}audio_formattype;


typedef struct audio_outformat_t
{
  audio_formattype type;
  GUID mediaSubType;
}audio_outformat;


typedef enum class scProperty_t
{
  Brightness = 0,                                     // 亮度
	Contrast = 1,                                       // 对比度
	Hue = 2,                                            // 色调
	Saturation = 3,                                     // 饱和度
	Sharpness = 4,                                      // 清晰度
	Gamma = 5,                                          // 伽马
	ColorEnable = 6,                                    // 黑白
	WhiteBalance = 7,                                   // 白平衡
	BacklightCompensation = 8,                          // 逆光对比
	Gain = 9                                            // 增益
}scProperty;


typedef enum class scControl_t
{
	Pan = 0,                                            // 全景
	Tilt = 1,                                           // 倾斜
	Roll = 2,                                           // 镜像翻转
	Zoom = 3,                                           // 缩放
	Exposure = 4,                                       // 曝光
	Iris = 5,                                           // 光圈
	Focus = 6                                           // 焦点
}scControl;


typedef enum class scPropertyFlag_t
{
	Auto = 1,                                           // 自动
	Manual = 2                                          // 手动
} scPropertyFlag;


typedef enum class scPowerLine_t
{
	PL_50Hz = 1,
	PL_60Hz = 2
}scPowerLine;

}

#endif // UTIL_H