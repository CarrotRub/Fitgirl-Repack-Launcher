#ifndef AGREEMENTS_H
#define AGREEMENTS_H

#include <windows.h>

// Function declarations
BOOL CALLBACK EnumChildWindowsProcNext(HWND hwnd, LPARAM lParam);
BOOL CALLBACK EnumWindowsProcDone(HWND hwnd, LPARAM lParam);
int scan_third();

#endif // AGREEMENTS_H
