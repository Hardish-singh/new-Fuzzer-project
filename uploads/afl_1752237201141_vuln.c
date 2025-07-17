#include <stdio.h>
#include <unistd.h>
#include <string.h>

int main() {
    char input[100];
    read(0, input, 100); // requires <unistd.h>
    if (strcmp(input, "crashme") == 0) {
        printf("Crash!\n");
    } else {
        printf("You said: %s\n", input);
    }
    return 0;
}
