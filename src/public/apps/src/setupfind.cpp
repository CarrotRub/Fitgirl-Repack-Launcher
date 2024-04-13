#include "setupfind.h"
#include <windows.h>
#include <iostream>
#include <string>




std::wstring setupWindows;

std::wstring CheckWindowsTitle(const std::wstring &windowTitle)
{
    if (windowTitle.find(L"Setup -") == 0)
    {
        return windowTitle;
    }
    return L"";
}

BOOL CALLBACK AnotherEnumWindowsProc(HWND hwnd, LPARAM lParam)
{
    const int bufferSize = 256;
    WCHAR buffer[bufferSize];
    GetWindowTextW(hwnd, buffer, bufferSize);
    std::wstring windowTitle(buffer);
    std::wstring foundTitle = CheckWindowsTitle(windowTitle);
    if (!foundTitle.empty())
    {
        setupWindows = foundTitle;
        // Perform actions on the found window

    }
    return TRUE; // Continue enumeration
}

LPCWSTR titleFinder()
{
    if (!EnumWindows(AnotherEnumWindowsProc, NULL))
    {
        std::cerr << "Failed to enumerate windows." << std::endl;
        return L"";
    }

    if (!setupWindows.empty())
    {
        std::wcout << setupWindows << std::endl;
    }
    else
    {
        std::cout << "Setup window not found." << std::endl;
    }

    LPCWSTR writableString = setupWindows.c_str();
    return writableString;
}
