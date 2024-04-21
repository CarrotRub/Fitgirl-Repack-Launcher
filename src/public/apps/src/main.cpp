#include "find_window.cpp"
#include "enum_setup-game.cpp"
#include "agreements.cpp"
#include "setupfind.cpp"
#include <iostream>

int main()
{
    // Call scan_first() from find_window.cpp
    scan_first();
    Sleep(3000);
    // Call scan_second() from enum_setup-game.cpp
    scan_second();
    Sleep(3000);
    // Call scan_third() from agreements.cpp
    scan_third();

    return 0;
}

// TO BUILD YOURSELF "installer.exe" YOU SHOULD COMPILE "main.cpp" USING THIS : g++ main.cpp -o ../bin/installer.exe -lgdi32 -static-libgcc -static-libstdc++ -lpthread
//mt -manifest installer.exe.manifest -outputresource:installer.exe;#1
// <3