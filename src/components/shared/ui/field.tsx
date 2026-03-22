"use client"

import { cn } from "@/lib/core/utils/utils"
import * as React from "react"

const FieldGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-4", className)} {...props} />
)
FieldGroup.displayName = "FieldGroup"

const Field = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-2", className)} {...props} />
)
Field.displayName = "Field"

export { Field,FieldGroup }

