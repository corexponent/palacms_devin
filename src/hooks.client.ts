import type { HandleClientError } from '@sveltejs/kit'
import posthog, { initialized } from '$lib/PostHog'
import { instance } from '$lib/instance'

export const handleError: HandleClientError = async ({ error, status }) => {
	// Only track errors if it's not a 404
	if (status === 404) {
		return
	}

	await initialized
	posthog.captureException(error, {
		version: instance.version
	})
}
