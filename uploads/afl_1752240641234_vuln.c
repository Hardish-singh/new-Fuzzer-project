#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main() {
    char buf[100];
    read(0, buf, 100); // read input from AFL
    if (strstr(buf, "crash")) {
        *(int*)0 = 0;  // force crash
    }
    printf("Received: %s\n", buf);
    return 0;
}
