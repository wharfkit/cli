import {
    AbstractUserInterface,
    cancelable,
    type Cancelable,
    type LoginContext,
    type PromptArgs,
    type PromptResponse,
    type UserInterfaceAccountCreationResponse,
    type UserInterfaceLoginResponse,
    type UserInterfaceTranslateOptions,
} from '@wharfkit/session'

/**
 * Non-interactive console UI for CLI usage.
 * Avoids stdin listeners that would prevent process exit.
 */
export class NonInteractiveConsoleUI extends AbstractUserInterface {
    async login(context: LoginContext): Promise<UserInterfaceLoginResponse> {
        return {
            walletPluginIndex: 0,
            chainId: context.chain?.id ?? context.chains?.[0]?.id,
            permissionLevel: context.permissionLevel,
        }
    }

    async onError(error: Error): Promise<void> {
        // eslint-disable-next-line no-console
        console.error(`[wharfkit] ${error.message}`)
    }

    async onAccountCreate(): Promise<UserInterfaceAccountCreationResponse> {
        return {}
    }

    async onAccountCreateComplete(): Promise<void> {
        // No-op
    }

    async onLogin(): Promise<void> {
        // No-op
    }

    async onLoginComplete(): Promise<void> {
        // No-op
    }

    async onTransact(): Promise<void> {
        // No-op
    }

    async onTransactComplete(): Promise<void> {
        // No-op
    }

    async onSign(): Promise<void> {
        // No-op
    }

    async onSignComplete(): Promise<void> {
        // No-op
    }

    async onBroadcast(): Promise<void> {
        // No-op
    }

    async onBroadcastComplete(): Promise<void> {
        // No-op
    }

    prompt(args: PromptArgs): Cancelable<PromptResponse> {
        if (args.title) {
            // eslint-disable-next-line no-console
            console.log(`[wharfkit] ${args.title}`)
        }
        if (args.body) {
            // eslint-disable-next-line no-console
            console.log(args.body)
        }
        return cancelable(Promise.resolve({} as PromptResponse), () => {
            // No cancellation work required
        })
    }

    status(message: string): void {
        // eslint-disable-next-line no-console
        console.log(`[wharfkit] ${message}`)
    }

    translate(key: string, options?: UserInterfaceTranslateOptions): string {
        return String(options?.default ?? key)
    }

    addTranslations(): void {
        // No-op
    }
}
