/* Exercise the pinned native NanoSVG parser before accepting a wallpaper. */
#include <stdio.h>
#include <stdlib.h>
#include "nanosvg.h"

int main(int argc, char **argv) {
    if (argc != 2) return 2;
    FILE *f = fopen(argv[1], "rb");
    if (!f) return 3;
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    rewind(f);
    if (size <= 0 || size > 2 * 1024 * 1024) { fclose(f); return 4; }
    char *data = calloc((size_t)size + 1, 1);
    if (!data || fread(data, 1, (size_t)size, f) != (size_t)size) { fclose(f); free(data); return 5; }
    fclose(f);
    NSVGimage *image = nsvgParse(data, "px", 96.0f);
    free(data);
    if (!image) return 6;
    int visible = 0;
    for (NSVGshape *shape = image->shapes; shape; shape = shape->next) {
        if ((shape->flags & NSVG_FLAGS_VISIBLE) && shape->opacity > 0 &&
            shape->bounds[2] > 0 && shape->bounds[3] > 0 &&
            shape->bounds[0] < image->width && shape->bounds[1] < image->height) visible++;
    }
    printf("{\"width\":%.3f,\"height\":%.3f,\"visible_shapes\":%d}\n", image->width, image->height, visible);
    int result = image->width == 1440 && image->height == 2960 && visible > 20 ? 0 : 7;
    nsvgDelete(image);
    return result;
}
