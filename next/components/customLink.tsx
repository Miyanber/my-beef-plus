import Link from "next/link"
import type { ComponentProps } from "react"

export function CustomLink({ href, children, ...props }: ComponentProps<"a">) {
  return (
    <Link href={href || "#"} {...props}>
      {children}
    </Link>
  )
}