'use client';

import * as React from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import clsx from 'clsx';

export interface SwitchProps
    extends React.ComponentPropsWithoutRef<typeof RadixSwitch.Root> { }

export const Switch = React.forwardRef<
    React.ElementRef<typeof RadixSwitch.Root>,
    SwitchProps
>(({ className, ...props }, ref) => (
    <RadixSwitch.Root
        ref={ref}
        className={clsx(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-emerald-500',
            className,
        )}
        {...props}
    >
        <RadixSwitch.Thumb
            className={clsx(
                'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
                'data-[state=checked]:translate-x-5',
                'data-[state=unchecked]:translate-x-0.5',
            )}
        />
    </RadixSwitch.Root>
));
Switch.displayName = 'Switch';
