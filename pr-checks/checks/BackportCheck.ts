import { context } from '@actions/github'
import { EventPayloads } from '@octokit/webhooks'
import { CheckContext } from '../types'
import { Check } from './Check'
import { CheckSubscriber } from '../Subscriber'

export interface BackportCheckConfig {
	title?: string
	targetUrl?: string
	backportEnabled?: string
	backportSkipped?: string
	failure?: string
	skipLabels?: string[]
}

export const defaultConfig = {
	title: 'Backport Check',
	backportEnabled: 'Backport enabled',
	backportSkipped: 'Backport skipped',
	failure: 'Backport decision needed',
}
const labelRegExp = /^backport ([^ ]+)(?: ([^ ]+))?$/

export class BackportCheck extends Check {
	id = 'check-backport'

	constructor(private config: BackportCheckConfig) {
		super()
	}

	subscribe(s: CheckSubscriber) {
		s.on(
			['pull_request', 'pull_request_target'],
			['labeled', 'unlabeled', 'opened', 'reopened', 'ready_for_review', 'synchronize'],
			async (ctx) => {
				const payload = context.payload as EventPayloads.WebhookPayloadPullRequest
				if (!payload) {
					return
				}

				if (payload.pull_request.state !== 'open') {
					return
				}

				for (let n = 0; n < payload.pull_request.labels.length; n++) {
					const existingLabel = payload.pull_request.labels[n]
					const matches = labelRegExp.exec(existingLabel.name)
					if (matches !== null) {
						return this.successEnabled(ctx, payload.pull_request.head.sha)
					}
				}

				if (this.config.skipLabels) {
					for (let n = 0; n < payload.pull_request.labels.length; n++) {
						const existingLabel = payload.pull_request.labels[n]

						for (let n = 0; n < this.config.skipLabels.length; n++) {
							const l = this.config.skipLabels[n]
							if (l === existingLabel.name) {
								return this.successSkip(ctx, payload.pull_request.head.sha)
							}
						}
					}
				}

				return this.failure(ctx, payload.pull_request.head.sha)
			},
		)
	}

	private successEnabled(ctx: CheckContext, sha: string) {
		const title = this.config.title ?? defaultConfig.title
		const description = this.config.backportEnabled ?? defaultConfig.backportEnabled
		return ctx.success({ sha, title, description, targetURL: this.config.targetUrl })
	}

	private successSkip(ctx: CheckContext, sha: string) {
		const title = this.config.title ?? defaultConfig.title
		const description = this.config.backportSkipped ?? defaultConfig.backportSkipped
		return ctx.success({ sha, title, description, targetURL: this.config.targetUrl })
	}

	private failure(ctx: CheckContext, sha: string) {
		const title = this.config.title ?? defaultConfig.title
		const description = this.config.failure ?? defaultConfig.failure
		return ctx.failure({ sha, title, description, targetURL: this.config.targetUrl })
	}
}
