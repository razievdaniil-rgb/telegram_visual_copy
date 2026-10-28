/* Exercise the pinned native NanoSVG parser before accepting a wallpaper. */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include "nanosvg.h"

/* Pinned Svg.m CGContextCoder/processShape format, template-filled paths.
 * No rasterization: the original iOS renderer consumes these vector commands.
 */
static void byte(FILE *out, uint8_t value) { fwrite(&value, 1, 1, out); }
static void point(FILE *out, uint8_t command, const float *values, size_t count) {
    byte(out, command);
    fwrite(values, sizeof(float), count, out);
}

static int storePrepared(NSVGimage *image, const char *path) {
    FILE *out = fopen(path, "wb");
    if (!out) return 8;
    int32_t dimensions[2] = {(int32_t)image->width, (int32_t)image->height};
    fwrite(dimensions, sizeof(int32_t), 2, out);
    for (NSVGshape *shape = image->shapes; shape; shape = shape->next) {
        if (!(shape->flags & NSVG_FLAGS_VISIBLE) || shape->opacity <= 0) continue;
        /* The bundled Web pattern consists of filled outlines only. */
        if (shape->stroke.type != NSVG_PAINT_NONE) { fclose(out); return 9; }
        if (shape->fill.type == NSVG_PAINT_NONE) continue;
        byte(out, 1); byte(out, (uint8_t)(fminf(fmaxf(shape->opacity, 0), 1) * 255));
        byte(out, 3);
        int hasStart = 0;
        float start[2] = {0, 0};
        for (NSVGpath *p = shape->paths; p; p = p->next) {
            if (p->npts < 1 || (p->npts - 1) % 3) { fclose(out); return 10; }
            if (!hasStart) { hasStart=1; start[0]=p->pts[0]; start[1]=p->pts[1]; }
            point(out, 4, p->pts, 2);
            for (int i=0; i<p->npts-1; i+=3) point(out, 6, &p->pts[i*2+2], 6);
            if (p->closed && hasStart) { point(out, 5, start, 2); hasStart=0; }
        }
        byte(out, shape->fillRule == NSVG_FILLRULE_EVENODD ? 8 : 9);
    }
    byte(out, 100);
    uint32_t giftRectangles = 0;
    fwrite(&giftRectangles, sizeof(giftRectangles), 1, out);
    int failed = ferror(out);
    if (fclose(out)) failed = 1;
    return failed ? 11 : 0;
}

int main(int argc, char **argv) {
    if (argc != 2 && argc != 3) return 2;
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
    if (!result && argc == 3) result = storePrepared(image, argv[2]);
    nsvgDelete(image);
    return result;
}
