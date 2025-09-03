import { z } from 'zod'

export const FieldBase = z.object({
	id: z.string().nonempty(),
	key: z.string(),
	label: z.string().optional(),
	type: z.string().nonempty(),
	config: z.any().nullable(),
	parent: z.string().optional(),
	index: z.number().int().nonnegative()
})

export type FieldBase = z.infer<typeof FieldBase>
