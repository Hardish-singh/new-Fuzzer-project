#include <stdio.h>
#include <string.h>
int main() {
  char input[100];
  read(0, input, 100);
  if (strstr(input, "crash")) {
    printf("💥 Crash!\n");
    *(int*)0 = 0;
  }
  return 0;
}
