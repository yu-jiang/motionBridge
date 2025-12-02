#define WIN32_LEAN_AND_MEAN
#include <WinSock2.h>
#include <ws2tcpip.h>
#include <Windows.h>
#include <Xinput.h>
#include <hidsdi.h>
#include <SetupAPI.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "xinput.lib")
#pragma comment(lib, "hid.lib")
#pragma comment(lib, "setupapi.lib")

#define SONY_VID 0x054C
#define DUALSHOCK4_PID_1 0x05C4
#define DUALSHOCK4_PID_2 0x09CC
#define DUALSENSE_PID 0x0CE6

#define MAX_CONTROLLERS 8

enum ControllerType
{
    CONTROLLER_NONE,
    CONTROLLER_XINPUT,
    CONTROLLER_DUALSHOCK4,
    CONTROLLER_DUALSENSE
};

enum TriggerMode
{
    TRIGGER_OFF = 0x00,
    TRIGGER_RIGID = 0x01,
    TRIGGER_PULSE = 0x02,
    TRIGGER_RIGID_A = 0x21,
    TRIGGER_RIGID_B = 0x22,
    TRIGGER_RIGID_AB = 0x23,
    TRIGGER_PULSE_AB = 0x26,
};

struct Controller
{
    ControllerType type;
    HANDLE handle;      // For Sony controllers
    int xinputIndex;    // For XInput controllers
};

Controller g_controllers[MAX_CONTROLLERS];
int g_controllerCount = 0;
bool g_silent = false;

void AddController(ControllerType type, HANDLE handle, int xinputIndex)
{
    if (g_controllerCount >= MAX_CONTROLLERS)
        return;

    g_controllers[g_controllerCount].type = type;
    g_controllers[g_controllerCount].handle = handle;
    g_controllers[g_controllerCount].xinputIndex = xinputIndex;
    g_controllerCount++;
}

void FindSonyControllers()
{
    GUID hidGuid;
    HidD_GetHidGuid(&hidGuid);

    HDEVINFO deviceInfo = SetupDiGetClassDevs(&hidGuid, nullptr, nullptr,
        DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);

    if (deviceInfo == INVALID_HANDLE_VALUE)
        return;

    SP_DEVICE_INTERFACE_DATA interfaceData = {};
    interfaceData.cbSize = sizeof(SP_DEVICE_INTERFACE_DATA);

    for (DWORD i = 0; SetupDiEnumDeviceInterfaces(deviceInfo, nullptr, &hidGuid, i, &interfaceData); i++)
    {
        DWORD requiredSize = 0;
        SetupDiGetDeviceInterfaceDetail(deviceInfo, &interfaceData, nullptr, 0, &requiredSize, nullptr);

        auto detailData = (PSP_DEVICE_INTERFACE_DETAIL_DATA)malloc(requiredSize);
        detailData->cbSize = sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA);

        if (SetupDiGetDeviceInterfaceDetail(deviceInfo, &interfaceData, detailData, requiredSize, nullptr, nullptr))
        {
            HANDLE device = CreateFile(detailData->DevicePath,
                GENERIC_READ | GENERIC_WRITE,
                FILE_SHARE_READ | FILE_SHARE_WRITE,
                nullptr, OPEN_EXISTING, 0, nullptr);

            if (device != INVALID_HANDLE_VALUE)
            {
                HIDD_ATTRIBUTES attrs = {};
                attrs.Size = sizeof(HIDD_ATTRIBUTES);

                if (HidD_GetAttributes(device, &attrs))
                {
                    if (attrs.VendorID == SONY_VID)
                    {
                        if (attrs.ProductID == DUALSENSE_PID)
                        {
                            printf("DualSense found!\n");
                            AddController(CONTROLLER_DUALSENSE, device, -1);
                            free(detailData);
                            continue;
                        }
                        else if (attrs.ProductID == DUALSHOCK4_PID_1 ||
                            attrs.ProductID == DUALSHOCK4_PID_2)
                        {
                            printf("DualShock 4 found!\n");
                            AddController(CONTROLLER_DUALSHOCK4, device, -1);
                            free(detailData);
                            continue;
                        }
                    }
                }
                CloseHandle(device);
            }
        }
        free(detailData);
    }

    SetupDiDestroyDeviceInfoList(deviceInfo);
}

void FindXInputControllers()
{
    for (int i = 0; i < 4; i++)
    {
        XINPUT_STATE state;
        if (XInputGetState(i, &state) == ERROR_SUCCESS)
        {
            printf("XInput controller found at index %d\n", i);
            AddController(CONTROLLER_XINPUT, nullptr, i);
        }
    }
}

void SetDualShock4Rumble(HANDLE device, uint8_t leftMotor, uint8_t rightMotor)
{
    if (!device)
        return;

    uint8_t report[32] = {};
    report[0] = 0x05;
    report[1] = 0xFF;
    report[4] = rightMotor;
    report[5] = leftMotor;

    DWORD bytesWritten;
    WriteFile(device, report, sizeof(report), &bytesWritten, nullptr);
}

void SetDualSenseHaptics(
    HANDLE device,
    uint8_t leftMotor,
    uint8_t rightMotor,
    uint8_t leftTriggerMode,
    uint8_t leftTriggerForce,
    uint8_t rightTriggerMode,
    uint8_t rightTriggerForce)
{
    if (!device)
        return;

    uint8_t report[48] = {};
    report[0] = 0x02;
    report[1] = 0xFF;
    report[2] = 0x15;

    report[3] = rightMotor;
    report[4] = leftMotor;

    report[11] = rightTriggerMode;
    report[12] = rightTriggerForce;
    report[13] = rightTriggerForce;
    report[14] = rightTriggerForce;

    report[22] = leftTriggerMode;
    report[23] = leftTriggerForce;
    report[24] = leftTriggerForce;
    report[25] = leftTriggerForce;

    DWORD bytesWritten;
    WriteFile(device, report, sizeof(report), &bytesWritten, nullptr);
}

void SetXInputRumble(int index, double left, double right)
{
    XINPUT_VIBRATION vib = {};
    vib.wLeftMotorSpeed = (WORD)(left * 65535);
    vib.wRightMotorSpeed = (WORD)(right * 65535);
    XInputSetState(index, &vib);
}

bool InitControllers()
{
    printf("Searching for controllers...\n");

    FindSonyControllers();
    FindXInputControllers();

    printf("Found %d controller(s)\n", g_controllerCount);
    return g_controllerCount > 0;
}

void SetRumbleAll(double left, double right, double leftTrigger, double rightTrigger)
{
    for (int i = 0; i < g_controllerCount; i++)
    {
        Controller* c = &g_controllers[i];

        switch (c->type)
        {
        case CONTROLLER_DUALSENSE:
        {
            uint8_t lm = (uint8_t)(left * 255);
            uint8_t rm = (uint8_t)(right * 255);
            uint8_t ltMode = leftTrigger > 0 ? TRIGGER_RIGID : TRIGGER_OFF;
            uint8_t ltForce = (uint8_t)(leftTrigger * 255);
            uint8_t rtMode = rightTrigger > 0 ? TRIGGER_RIGID : TRIGGER_OFF;
            uint8_t rtForce = (uint8_t)(rightTrigger * 255);
            SetDualSenseHaptics(c->handle, lm, rm, ltMode, ltForce, rtMode, rtForce);
            break;
        }

        case CONTROLLER_DUALSHOCK4:
        {
            uint8_t lm = (uint8_t)(left * 255);
            uint8_t rm = (uint8_t)(right * 255);
            SetDualShock4Rumble(c->handle, lm, rm);
            break;
        }

        case CONTROLLER_XINPUT:
            SetXInputRumble(c->xinputIndex, left, right);
            break;

        default:
            break;
        }
    }
}

void ParseAndSetRumble(const char* json)
{
    const char* cmd = strstr(json, "\"command\"");
    if (!cmd || !strstr(cmd, "forces"))
        return;

    const char* arr = strstr(json, "\"forces\"");
    if (!arr)
        return;

    const char* bracket = strchr(arr, '[');
    if (!bracket)
        return;

    double f[4] = { 0, 0, 0, 0 };
    int parsed = sscanf_s(bracket, "[%lf,%lf,%lf,%lf]", &f[0], &f[1], &f[2], &f[3]);

    if (parsed != 4)
    {
        printf("Failed to parse forces\n");
        return;
    }

    if (!g_silent)
    {
        printf("Forces: [%.2f, %.2f, %.2f, %.2f]\n", f[0], f[1], f[2], f[3]);
    }
    SetRumbleAll(f[0], f[1], f[2], f[3]);
}

void Cleanup()
{
    SetRumbleAll(0, 0, 0, 0);

    for (int i = 0; i < g_controllerCount; i++)
    {
        if (g_controllers[i].handle)
        {
            CloseHandle(g_controllers[i].handle);
            g_controllers[i].handle = nullptr;
        }
    }
    g_controllerCount = 0;
}

int main(int argc, char* argv[])
{
    // Parse arguments
    for (int i = 1; i < argc; i++)
    {
        if (strncmp(argv[i], "--silent", 8) == 0 || strncmp(argv[i], "-s", 2) == 0)
        {
            g_silent = true;
        }
    }

    if (!InitControllers())
    {
        printf("No controllers found. Exiting.\n");
        return 1;
    }

    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0)
    {
        printf("WSAStartup failed\n");
        Cleanup();
        return 1;
    }

    SOCKET server = socket(AF_INET, SOCK_STREAM, 0);
    if (server == INVALID_SOCKET)
    {
        printf("Socket creation failed\n");
        Cleanup();
        return 1;
    }

    sockaddr_in addr = {};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR)
    {
        printf("Bind failed\n");
        Cleanup();
        return 1;
    }

    listen(server, 1);
    printf("TCP server listening on port 8080...\n");

    while (true)
    {
        printf("Waiting for connection...\n");
        SOCKET client = accept(server, nullptr, nullptr);
        if (client == INVALID_SOCKET)
            continue;

        printf("Client connected!\n");

        char buffer[1024];
        while (true)
        {
            int len = recv(client, buffer, sizeof(buffer) - 1, 0);
            if (len <= 0)
                break;

            buffer[len] = '\0';
            ParseAndSetRumble(buffer);
        }

        printf("Client disconnected\n");
        SetRumbleAll(0, 0, 0, 0);
        closesocket(client);
    }

    closesocket(server);
    WSACleanup();
    Cleanup();

    return 0;
}