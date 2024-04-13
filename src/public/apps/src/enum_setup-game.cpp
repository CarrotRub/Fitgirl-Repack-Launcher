#include <Windows.h>
#include <iostream>
#include "setupfind.h"



HWND EnumChildWindowsRecursive(HWND hwndParent)
{
    HWND hwndChild = FindWindowExW(hwndParent, NULL, NULL, NULL);

    if (hwndChild == NULL)
    {
        return NULL;
    }

    wchar_t szClassName[256];
    GetClassNameW(hwndChild, szClassName, sizeof(szClassName) / sizeof(wchar_t));

    wchar_t szWindowText[256];
    GetWindowTextW(hwndChild, szWindowText, sizeof(szWindowText) / sizeof(wchar_t));

    std::wcout << L"Handle: " << hwndChild << L", Class Name: " << szClassName << L", Text: " << szWindowText << std::endl;

    if (_wcsicmp(szClassName, L"TNewCheckBox") == 0 && _wcsicmp(szWindowText, L"Limit installer to 2 GB of RAM usage") == 0)
    {
        return hwndChild;
    }

    HWND hwndSubChild = EnumChildWindowsRecursive(hwndChild);
    if (hwndSubChild != NULL)
        return hwndSubChild;

    return EnumChildWindowsRecursive(FindWindowExW(hwndParent, hwndChild, NULL, NULL));
}

void ClickCheckBox(HWND hwndCheckBox)
{
    SendMessage(hwndCheckBox, BM_CLICK, 0, 0);
}

int GetSystemRAM()
{
    MEMORYSTATUSEX statex;
    statex.dwLength = sizeof(statex);

    if (GlobalMemoryStatusEx(&statex))
    {
        DWORDLONG totalMemoryInBytes = statex.ullTotalPhys;
        int totalMemoryInGB = static_cast<int>(totalMemoryInBytes / (1024 * 1024 * 1024));
        return totalMemoryInGB;
    }

    return -1;
}

int scan_second()
{

    HWND hwnd = FindWindowW(NULL, titleFinder());
    
    if (hwnd == NULL)
    {
        std::cout << L"Window title not found" << std::endl;
        return 0;
    }

    std::cout << L"Found window with title" << std::endl;

    HWND hwndCheckBox = EnumChildWindowsRecursive(hwnd);
    if (hwndCheckBox == NULL)
    {
        std::cout << "Checkbox not found" << std::endl;
        return 0;
    }

    std::cout << "Checkbox found" << std::endl;

    DWORD ramSizeGB = GetSystemRAM();
    if (ramSizeGB <= 8)
    {
        std::cout << "8 GB of RAM or less" << std::endl;
        std::cout << "Checkbox handle: 0x" << std::hex << reinterpret_cast<uintptr_t>(hwndCheckBox) << std::endl;
        ClickCheckBox(hwndCheckBox);
        if (SendMessage(hwndCheckBox, BM_GETCHECK, 0, 0) == BST_CHECKED)
        {
            std::cout << "Checkbox clicked successfully" << std::endl;
        }
        else
        {
            std::cout << "Failed to click the checkbox" << std::endl;
        }
    }
    else
    {
        std::cout << "More than 8 GB of RAM" << std::endl;
    }
    return 0;
}

