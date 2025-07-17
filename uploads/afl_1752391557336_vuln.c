#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main() {
    char buf[100];
    ssize_t n = read(0, buf, 99);
    if (n > 0) buf[n] = '\0';  // Null-terminate

    if (strstr(buf, "crash")) {
        *(int*)0 = 0;  // force crash
    }

    printf("Done: %s\n", buf);
    return 0;
}
