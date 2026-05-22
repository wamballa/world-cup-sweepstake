"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={className ? `${className} pr-10` : "pr-10"}
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <Button
        aria-label={isVisible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
        onClick={() => setIsVisible((current) => !current)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        {isVisible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
