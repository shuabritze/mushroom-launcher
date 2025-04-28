import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/web/lib/utils";

import "typeface-roboto/index.css";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
                destructive:
                    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                link: "text-primary underline-offset-4 hover:underline",
                maplestory_primary:
                    "active:from-[#F7DE4D] active:via-[#F2B000] active:to-[#F2B000] transition-colors duration-250 ease-out font-light text-shadow-2xs hover:from-[#FFF063] hover:via-[#FFE13B] hover:to-[#FFF797] hover:border-[#575655] rounded-sm border-2 border-[#594901] from-0% via-10% to-80% bg-gradient-to-t from-[#FFEB56] via-[#FFCC00] to-[#FAEE6B] [font-family:Roboto] text-[#353431] hover:text-black",
                maplestory_secondary:
                    "active:from-[#F7DE4D] active:via-[#F2B000] active:to-[#F2B000] transition-colors duration-250 ease-out font-light text-shadow-2xs hover:from-[#FFF063] hover:via-[#FFE13B] hover:to-[#FFF797] hover:border-[#575655] rounded-sm border-2 border-[#594901] from-0% via-10% to-80% bg-gradient-to-t from-[#F2F2F2] via-[#CECECE] to-[#EEEEEE] [font-family:Roboto] text-[#353431] hover:text-black",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9",
                maplestory: "h-12 px-4 py-2 has-[>svg]:px-3",
                maplestory_icon: "w-7 h-7 px-2 py-1 has-[>svg]:px-2.5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
