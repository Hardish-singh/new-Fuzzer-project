#include <stdio.h>
#include <string.h>

int main() {
    char input[100];
    scanf("%s", input);

    if (strcmp(input, "crashme") == 0) {
        printf("BOOM\n");
    } else {
        printf("Input: %s\n", input);
    }

    return 0;
}
