/**
 * Debounce decorator for class methods
 * @param delayMs - Delay in milliseconds
 */
export function debounce(delayMs: number) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        let timeoutId: NodeJS.Timeout;
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            clearTimeout(timeoutId);
            return new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    resolve(originalMethod.apply(this, args));
                }, delayMs);
            });
        };

        return descriptor;
    };
}
