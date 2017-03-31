import "reflect-metadata";
import { FOCUS } from "./_metadata-keys";

export function FocusTest(target: Object, propertyKey: string, descriptor?: TypedPropertyDescriptor<any>) {

    // mark test method as focussed
    Reflect.defineMetadata(FOCUS, true, target, propertyKey);
};
