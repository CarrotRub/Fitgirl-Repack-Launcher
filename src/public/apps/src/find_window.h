#ifndef FIND_WINDOW_H
#define FIND_WINDOW_H

#include <windows.h>
#include <iostream>
#include <vector>

// Function declarations
static BOOL CALLBACK EnumChildWindowsProc(HWND hwnd, LPARAM lParam);
static BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam);
int scan_first();

#endif // FIND_WINDOW_H
