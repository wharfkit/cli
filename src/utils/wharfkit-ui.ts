import {
    AbstractUserInterface,
    cancelable,
    type Cancelable,
    type CreateAccountContext,
    type LocaleDefinitions,
    type LoginContext,
    type LoginOptions,
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
        console.error(`[wharfkit] ${error.message}`)
    }

    async onAccountCreate(
        _context: CreateAccountContext
    ): Promise<UserInterfaceAccountCreationResponse> {
        return {}
    }

    async onAccountCreateComplete(): Promise<void> {
        // No-op
    }

    async onLogin(_options?: LoginOptions): Promise<void> {
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
            console.log(`[wharfkit] ${args.title}`)
        }
        if (args.body) {
            console.log(args.body)
        }
        return cancelable(Promise.resolve({} as PromptResponse), () => {
            // No cancellation work required
        })
    }

    status(message: string): void {
        console.log(`[wharfkit] ${message}`)
    }

    translate(key: string, options?: UserInterfaceTranslateOptions, _namespace?: string): string {
        return String(options?.default ?? key)
    }

    addTranslations(_translations: LocaleDefinitions): void {
        // No-op
    }
}

