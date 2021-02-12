```ts
// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ This is the module plugin template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

/*~ On this line, import the module which this module adds to */
import * as m from 'someModule';

/*~ You can also import other modules if needed */
import * as other from 'anotherModule';

/*~ Here, declare the same module as the one you imported above */
declare module 'someModule' {
    /*~ Inside, add new function, classes, or variables. You can use
     *~ unexported types from the original module if needed. */
    export function theNewMethod(x: m.foo): other.bar;

    /*~ You can also add new properties to existing interfaces from
     *~ the original module by writing interface augmentations */
    export interface SomeModuleOptions {
        someModuleSetting?: string;
    }

    /*~ New types can also be declared and will appear as if they
     *~ are in the original module */
    export interface MyModulePluginOptions {
        size: number;
    }
}
```