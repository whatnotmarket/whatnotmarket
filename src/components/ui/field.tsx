"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const FieldGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-4", className)} {...props} />
)
FieldGroup.displayName = "FieldGroup"

const Field = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-2", className)} {...props} />
)
Field.displayName = "Field"

export { Field, FieldGroup }
