#ifndef XR_RET_H
#define XR_RET_H

#include <stdint.h>

typedef struct tagsPalmInfo
{
    uint8_t status;
    uint8_t palm_bright;
    uint16_t x;
    uint32_t y;
    uint16_t width;
    uint16_t height;
}sPalmInfo;

const static int32_t XR_VEIN_FEATURE_INFO_SIZE = 1036;
const static float XR_VEIN_THRESH = 0.95f;

//Enroll TIp
const static int32_t PV_TIP_INPUT_PALM  = 1;
const static int32_t PV_TIP_MOVE_FARAWAY = 2;
const static int32_t PV_TIP_MOVE_CLOSER   = 3;
const static int32_t PV_TIP_INVALID_BRIGHT = 4;
const static int32_t PV_TIP_KEEP_PALM_STABLE = 5;
const static int32_t PV_TIP_KEEP_PALM_DIRECTION = 6;
const static int32_t PV_TIP_MOVE_PALM_DOWN = 7;
const static int32_t PV_TIP_MOVE_PALM_UP = 8;
const static int32_t PV_TIP_MOVE_PALM_LEFT = 9;
const static int32_t PV_TIP_MOVE_PALM_RIGHT = 10;
const static int32_t PV_TIP_CAP_SUCCESS = 20;
const static int32_t PV_TIP_ENROLL_FINISH = 100;


//ERR CODE
const static int32_t PV_OK = 0;
const static int32_t PV_ERR = -1;
const static int32_t PV_ERR_NO_DEVICE = -2;
const static int32_t PV_ERR_NULL_PTR = -3;
const static int32_t PV_ERR_PARAM = -4;
const static int32_t PV_ERR_UNSUPPORT = -5;
const static int32_t PV_ERR_HANDLE = -6;
const static int32_t PV_ERR_NO_HAND = -7;
const static int32_t PV_ERR_MEM = -8;
const static int32_t PV_ERR_BROKEN_FEAT = -9;

//dev error
const static int32_t PV_ERR_DEV_NOT_OPEN = -20;
const static int32_t PV_ERR_DEV_BAD_IMG = -21;
const static int32_t PV_ERR_DEV_TIMEOUT = -22;
const static int32_t PV_ERR_DEV_PARAM   = -23;
const static int32_t PV_ERR_DEV_UNKNOWN = -24;
const static int32_t PV_ERR_NOT_SAME_FINGER = -25;
const static int32_t PV_ERR_FEAT_DUP = -26;

//algo error
const static int32_t PV_ERR_LOAD_ALGO_LIB = -30;
const static int32_t PV_ERR_EXTRACT_FEAT = -31;
const static int32_t PV_ERR_QUALITY_LOW_LIGHT = -32;
const static int32_t PV_ERR_QUALITY_HIGH_LIGHT = -33;
const static int32_t PV_ERR_QUALITY_BAD_TEXTURE = -34;
const static int32_t PV_ERR_QUALITY_BAD_IMG = -35;
const static int32_t PV_ERR_QUALITY_LIVENESS = -36;
const static int32_t PV_ERR_QUALITY_PALM_MOVE = -37;
const static int32_t PV_ERR_LOW_QUALITY = -38;

//usb error
const static int32_t PV_ERR_USB_INIT = -40;
const static int32_t PV_ERR_USB_PERMISION = -41;
const static int32_t PV_ERR_USB_TIMEOUT = -42;
const static int32_t PV_ERR_USB_BROKEN_PKT = -43;
const static int32_t PV_ERR_USB_TRANSFER = -44;
const static int32_t PV_ERR_OPEN_DEV = -45;
const static int32_t PV_ERR_USB_UNKNOWN = -48;

//database error
const static int32_t PV_ERR_NO_USER_ID = -60;
const static int32_t PV_ERR_USER_ID_DUP = -61;
const static int32_t PV_ERR_USER_DB_FULL = -62;
const static int32_t PV_ERR_USER_FEAT_DUP = -63;
const static int32_t PV_ERR_FILE_NOT_FOUND = -65;

//net error
const static int32_t PV_ERR_RUN_NET = -70;

const static int32_t PV_ERR_OPEN_FILE = -81;

//lic error
const static int32_t PV_ERR_LIC = -1000;

#endif