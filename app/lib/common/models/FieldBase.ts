import { z } from 'zod'

export const FieldBase = z.object({
	id: z.string().nonempty(),
	key: z.string(),
	label: z.string(),
	type: z.string().nonempty(),
	config: z.any().nullable(),
	parent: z.string().optional(),
	index: z.number().optional()
})

export type FieldBase = z.infer<typeof FieldBase>
