#ifndef XR_VEIN_API_H
#define XR_VEIN_API_H

#include <stdint.h>
#include <tdx_ret.h>


#ifdef FVAPI
#undef FVAPI
#endif

#if defined(_WIN32) || defined(_WIN64)
#	define FVAPI __declspec( dllexport )
#	define FVCALL __stdcall
#elif defined(__linux__)
#	define FVAPI   __attribute ((visibility("default")))
#	define FVCALL
#else
#	define FVAPI
#	define FVCALL
#endif

#ifdef __cplusplus
extern "C" {
#endif

/*
* XRCommonVeinAlgAPI
*/

/*
* function: 获取SDK的版本号
* versionBuf: 版本号缓冲区，最少64字节
* pBufLen: 缓冲区长度， 最少64字节, 成功返回字符串长度
* return: 成功返回PV_OK，失败返回错误码
 * 示例： "xr_common_vein_v2.0.0";
*/

FVAPI int32_t FVCALL XR_Vein_GetVersion(char *pVersionBuf, int32_t *pBufLen);


/*
* function: 初始化SDK
* ppAlgHandle: SDK的句柄指针
* return: 成功返回PV_OK，失败返回错误码
*/
FVAPI int32_t FVCALL XR_Vein_Init(void **ppAlgHandle);

/*
* function: 释放SDK句柄
* pDevHandle: SDK的句柄
* return: 成功返回PV_OK，失败返回错误码
*/
FVAPI int32_t FVCALL XR_Vein_DeInit(void *pDevHandle);


/*
 * function: 获取当前鉴权码
 * pDevHandle: SDK的句柄
 * pCodeBuf[out]: 鉴权码缓冲区，不少于16个字节
 * pLen[in/out]: 输入为鉴权码缓冲区长度，输出为鉴权码实际长度
 * return: 成功返回PV_OK，失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_GetLicCode(void *pDevHandle, uint8_t *pCodeBuf, int32_t *pLen);


/*
 * function: 使用Licence激活当前SDK
 * pDevHandle: SDK的句柄
 * pCodeBuf[in]: 激活码缓冲区
 * len[in]: 激活码长度
 * return: 成功返回PV_OK，失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_ActivateVeinSDK(void *pDevHandle, uint8_t *pLicBuf, int32_t len);

/*
 * function: 初始化注册器
 * pDevHandle: SDK的句柄
 * return: 成功返回PV_OK，失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_InitEnrollEnv(void *pDevHandle);

/*
 * function: 录入掌静脉图像
 * pDevHandle: SDK的句柄
 * pImgBuf: 掌静脉图像
 * livenessFlag: 活体判断标志位，0：不进行活体判断，1：检测带活体判断
 * pEnrollStep:注册进度指针，数值为0-5
 * pEnrollTip: 注册提示
 * pPalmInfo: 手掌检测信息，status非0表示检测成功
 * pHighBright: 图像高亮区域（80x80）平均亮度信息
 * return: 成功返回PV_OK， 失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_TryEnroll(void *pDevHandle, uint8_t pImgBuf, int32_t imgRows, int32_t imgCols, int32_t livenessFlag, int32_t *pEnrollStep, int32_t *pEnrollTip, sPalmInfo *pPalmInfo, uint8_t *pHighBright);

/*
 * function: 获取最终掌静脉特征
 * pDevHandle: SDK的句柄
 * pRoiImgBuf： ROI图像缓冲区,可以通过此图像进行特征值提取，进而获取到注册特征值,为NULL则不返回图像
 * pRoiImgBufLen： ROI图像缓冲区长度，默认大小为160x160
 * pRegFeatBuf: 注册特征缓冲区
 * pBufLen：特征缓冲区的长度，不小于1KB,成功返回特征值实际长度
 * return: 成功返回PV_OK，失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_FinishEnroll(void *pDevHandle, uint8_t *pRoiImgBuf, int32_t *pRoiImgBufLen, uint8_t *pRegFeatBuf, int32_t *pBufLen);


/*
 * function: 从原始图像检测并提取的掌静脉特征，仅用于识别，不建议用于注册
 * pDevHandle: SDK的句柄
 * pImgBuf: 输入掌静脉图像
 * imgRows, imgCols: 输入图像的高度和宽度
 * livenessFlag: 活体判断标志位，0：不进行活体判断，1：检测带活体判断
 * pRegFeatBuf: 特征缓冲区
 * pBufLen：特征缓冲区的长度，不小于4KB,成功返回特征值实际长度
 * pCapTip: 识别提示
 * pPalmInfo: 手掌检测信息，status非0表示检测成功
 * pHighBright: 图像高亮区域（80x80）平均亮度信息
 * return: 成功返回PV_OK， 失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_GrabFeatureFromFullImg(void *pDevHandle, uint8_t *pImgBuf, int32_t imgRows, int32_t imgCols, int32_t livenessFlag, uint8_t *pFeatBuf, int32_t *pBufLen, int32_t *pCapTip, sPalmInfo *pPalmInfo, uint8_t *pHighBright);


/*
 * function: 从注册图像提取注册特征值； 一般用于远程同步；
 * pDevHandle: SDK的句柄
 * pImgBuf: 输入掌静脉ROI图像，灰度图，数据必须来源于XR_Vein_FinishEnroll的pRoiImgBuf
 * imgRows, imgCols: 输入图像的高度和宽度，固定为160x160
 * pRegFeatBuf: 注册特征缓冲区
 * pBufLen：特征缓冲区的长度，不小于4KB,成功返回特征值实际长度(1036字节)
 * return: 成功返回PV_OK， 失败返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_GrabFeatureFromEnrollRoiImg(void *pDevHandle, uint8_t *pImgBuf, int32_t imgRows, int32_t imgCols, uint8_t *pFeatBuf, int32_t *pBufLen);



/*
 * function: 校验掌静脉特征的合法性
 * pRegFeatBuf: 掌静脉特征缓冲区
 * bufLen：掌静脉缓冲区长度
 * return: 成功返回PV_OK，特征错误返回错误码
 */
FVAPI int32_t FVCALL XR_Vein_CheckFeat(uint8_t *pFeatBuf, int32_t bufLen);


/*
 * function: 比对掌静脉特征之间距离
 * pFeatBuf1: 掌静脉特征缓冲区1
 * bufLen1： 掌静脉特征缓冲区1长度
 * pFeatBuf2: 掌静脉特征缓冲区2
 * bufLen2: 掌静脉特征缓冲区2长度
 * pDist： 掌静脉特征比较距离，阈值在0.9-1.0之间,建议阈值0.95f;
 */
FVAPI int32_t FVCALL XR_Vein_CalcFeatureDist(uint8_t *pFeatBuf1, int32_t bufLen1, uint8_t *pFeatBuf2, int32_t bufLen2, float *pDist);


#ifdef __cplusplus
}
#endif





#endif
