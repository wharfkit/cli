import type {UserInterface} from '@wharfkit/session'

declare module '@wharfkit/session' {
    interface SessionArgs {
        ui?: UserInterface
    }

    interface SessionOptions {
        ui?: UserInterface
    }
}
