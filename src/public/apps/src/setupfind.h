#ifndef SETUPFIND_H
#define SETUPFIND_H

#include <windows.h>
#include <iostream>
#include <string>

// Function declarations
std::wstring CheckWindowsTitle(const std::wstring &windowTitle);
BOOL CALLBACK AnotherEnumWindowsProc(HWND hwnd, LPARAM lParam);
LPCWSTR titleFinder();

#endif // SETUPFIND_H
