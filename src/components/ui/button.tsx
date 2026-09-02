import * as React from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "secondary" | "destructive" | "ghost" | "outline" | "link";
    size?: "default" | "sm" | "lg" | "icon";
  }
>(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-11 px-8 text-sm",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
