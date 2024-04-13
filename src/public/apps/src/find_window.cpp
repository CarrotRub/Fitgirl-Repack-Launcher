#include "find_window.h"
#include <iostream>
#include <windows.h>
#include <vector>

HWND g_OKButtonHandle = nullptr; // Global variable to store the handle of the OK button

static BOOL CALLBACK EnumChildWindowsProc(HWND hwnd, LPARAM lParam)
{
    // Check if the child window class is "Button"
    wchar_t className[256];
    if (GetClassNameW(hwnd, className, sizeof(className) / sizeof(wchar_t)) > 0)
    {
        if (wcsstr(className, L"Button") != nullptr)
        {
            // Get the length of the button text
            int textLength = GetWindowTextLengthW(hwnd);
            if (textLength > 0)
            {
                // Allocate buffer for the button text
                std::wstring buttonText(textLength + 1, L'\0');

                // Get the button text
                GetWindowTextW(hwnd, &buttonText[0], textLength + 1);

                // Print button information
                std::wcout << L"Button handle: " << hwnd << L", Text: " << buttonText << std::endl;

                // Check if the button text contains "OK"
                if (wcsstr(buttonText.c_str(), L"OK") != nullptr)
                {
                    // Store the handle of the OK button
                    g_OKButtonHandle = hwnd;
                    std::wcout << L"Found OK button!" << std::endl;
                }
            }
        }
    }
    return TRUE; // Continue enumeration
}

static BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam)
{
    // Check if the window title contains "Select Setup Language"
    wchar_t title[256];
    if (GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t)) > 0)
    {
        if (wcsstr(title, L"Select Setup Language") != nullptr)
        {
            // Found the "Select Setup Language" window, enumerate its child windows
            EnumChildWindows(hwnd, EnumChildWindowsProc, 0);

            // If the OK button handle was found, click it
            if (g_OKButtonHandle != nullptr)
            {
                SendMessage(g_OKButtonHandle, BM_CLICK, 0, 0);
                std::wcout << L"Clicked OK button!" << std::endl;
                if (wcsncmp(title, L"Setup -", wcslen(L"Setup -")) == 0)
                {
                    // Found a window starting with "Setup -", enumerate its child windows
                    EnumChildWindows(hwnd, EnumChildWindowsProc, 0);
                }
            }
            else
            {
                std::wcerr << L"OK button not found." << std::endl;
            }
        }
    }
    return TRUE; // Continue enumeration
}

int scan_first()
{
    EnumWindows(EnumWindowsProc, 0);
    return 0;
}

