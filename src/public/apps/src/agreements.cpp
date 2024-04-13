

#include "setupfind.h"
#include "agreements.h"
#include <iostream>
#include <windows.h>
#include <vector>

HWND g_NextButtonHandle = nullptr;
BOOL CALLBACK EnumChildWindowsProcNext(HWND hwnd, LPARAM lParam)
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

                // Check if the button text contains "next"
                if (wcsstr(buttonText.c_str(), L"Next >") != nullptr)
                {
                    // Store the handle of the OK button
                    g_NextButtonHandle = hwnd;
                    std::wcout << L"Found Next button!" << std::endl;
                }
            }
        }
    }
    return TRUE; // Continue enumeration
}

BOOL g_WindowFound = FALSE;

BOOL CALLBACK EnumWindowsProcDone(HWND hwnd, LPARAM lParam)
{
    // Check if the window title contains "Select Setup Language"
    wchar_t title[256];
    if (GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t)) > 0)
    {
        if (wcsstr(title, titleFinder()) != nullptr)
        {
            // Found the "Select Setup Language" window, enumerate its child windows
            EnumChildWindows(hwnd, EnumChildWindowsProcNext, 0);

            SendMessage(g_NextButtonHandle, BM_CLICK, 0, 0);
            std::wcout << L"Clicked Next button!" << std::endl;

            g_WindowFound = TRUE; // Set the flag to stop enumerating windows
        }
    }

    // Stop enumerating if the target window is found
    return !g_WindowFound;
}

int scan_third()
{
    HWND hwnd = FindWindowW(NULL, titleFinder());
    if (hwnd == NULL)
    {
        std::cout << L"Window title not found" << std::endl;
        return 0;
    }

    g_NextButtonHandle = NULL; // Reset the button handle

    EnumWindows(EnumWindowsProcDone, 0);
    std::cout << L"Found window with title" << std::endl;


    return 0;
}

