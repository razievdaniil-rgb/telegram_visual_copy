#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#include <dlfcn.h>

// Run only on the disposable QA simulator. Calls the exact compiled decoder.
int main(int argc, char **argv) {
    @autoreleasepool {
        if (argc != 4) return 2;
        void *handle = dlopen(argv[1], RTLD_NOW | RTLD_GLOBAL);
        if (!handle) { fprintf(stderr, "%s\n", dlerror()); return 3; }
        NSData *(*prepare)(NSData *, BOOL) = dlsym(handle, "prepareSvgImage");
        UIImage *(*render)(NSData *, CGSize, UIColor *, CGFloat, bool) = dlsym(handle, "renderPreparedImage");
        if (!prepare || !render) return 4;
        NSData *svg = [NSData dataWithContentsOfFile:[NSString stringWithUTF8String:argv[2]]];
        NSData *prepared = prepare(svg, YES);
        if (!prepared.length) return 5;
        NSString *output = [NSString stringWithUTF8String:argv[3]];
        if (![prepared writeToFile:[output stringByAppendingPathComponent:@"prepared.bin"] atomically:YES]) return 6;
        UIImage *image = render(prepared, CGSizeMake(428, 926), nil, 1.0, true);
        if (!image) return 7;
        if (![UIImagePNGRepresentation(image) writeToFile:[output stringByAppendingPathComponent:@"decoded.png"] atomically:YES]) return 8;
        printf("Native SVG decoder: %lu input, %lu prepared bytes, %.0fx%.0f image\n",
               (unsigned long)svg.length, (unsigned long)prepared.length, image.size.width, image.size.height);
    }
    return 0;
}
