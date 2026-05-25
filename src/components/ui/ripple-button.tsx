"use client"

import React, { MouseEvent, useEffect, useState } from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string
  duration?: string
  asChild?: boolean
}

export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  RippleButtonProps
>(
  (
    {
      className,
      children,
      rippleColor = "rgba(255, 255, 255, 0.25)",
      duration = "600ms",
      onClick,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const [buttonRipples, setButtonRipples] = useState<
      Array<{ x: number; y: number; size: number; key: number }>
    >([])

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      createRipple(event)
      onClick?.(event)
    }

    const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const newRipple = { x, y, size, key: Date.now() }
      setButtonRipples((prevRipples) => [...prevRipples, newRipple])
    }

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout> | null = null

      if (buttonRipples.length > 0) {
        const lastRipple = buttonRipples[buttonRipples.length - 1]
        timeout = setTimeout(() => {
          setButtonRipples((prevRipples) =>
            prevRipples.filter((ripple) => ripple.key !== lastRipple.key)
          )
        }, parseInt(duration))
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout)
        }
      }
    }, [buttonRipples, duration])

    const Comp = asChild ? Slot.Root : "button"

    return (
      <Comp
        className={cn(
          "relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 px-4 py-2 text-center text-white transition-colors hover:bg-zinc-900 hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400/40",
          className
        )}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        <span className="relative flex w-full items-center justify-center overflow-hidden rounded-[inherit] text-white">
          <span className="relative z-10">{children}</span>
          <span className="pointer-events-none absolute inset-0">
            {buttonRipples.map((ripple) => (
              <span
                className="animate-rippling absolute rounded-full opacity-12"
                key={ripple.key}
                style={
                  {
                    width: `${ripple.size}px`,
                    height: `${ripple.size}px`,
                    top: `${ripple.y}px`,
                    left: `${ripple.x}px`,
                    background: rippleColor,
                    transform: `scale(0)`,
                    "--duration": duration,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        </span>
      </Comp>
    )
  }
)

RippleButton.displayName = "RippleButton"
