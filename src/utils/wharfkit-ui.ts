import {ConsoleUserInterface} from '@wharfkit/console-renderer'
import {
    cancelable,
    type Cancelable,
    type PromptArgs,
    type PromptResponse,
} from '@wharfkit/session'

/**
 * Console UI wrapper that avoids interactive prompts so automated tests can complete.
 */
export class NonInteractiveConsoleUI extends ConsoleUserInterface {
    prompt(args: PromptArgs): Cancelable<PromptResponse> {
        if (args.title) {
            console.log(`[wharfkit] ${args.title}`)
        }
        if (args.body) {
            console.log(args.body)
        }

        return cancelable(Promise.resolve({} as PromptResponse), () => {
            /* no cancellation work required */
        })
    }
}

