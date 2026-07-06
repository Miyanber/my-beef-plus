import type { ComponentProps } from "react"

export function CustomLink({ href, children, ...props }: ComponentProps<"a">) {
  return (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  )
}