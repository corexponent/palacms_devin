import { FieldBase } from '../FieldBase'
import { z } from 'zod'
import { Entity } from '../Entity'

export const SliderField = FieldBase.extend({
	type: z.literal('slider')
})

export type SliderField = z.infer<typeof SliderField>
