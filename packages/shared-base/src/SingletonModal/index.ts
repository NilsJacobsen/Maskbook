import { Emitter } from '@servie/events'

export type SingletonModalRefCreator<OpenProps = void, CloseProps = void> = (
    onOpen: (props: OpenProps) => void,
    onClose: (props: CloseProps) => void,
    onAbort: (error: Error) => void,
) => {
    peek: () => boolean
    open: (props: OpenProps) => void
    close: (props: CloseProps) => void
    abort?: (error: Error) => void
}

export interface SingletonModalProps {
    children: React.ReactNode
}

export class SingletonModal<
    OpenProps = void,
    CloseProps = void,
    T extends SingletonModalRefCreator<OpenProps, CloseProps> = SingletonModalRefCreator<OpenProps, CloseProps>,
> {
    readonly emitter = new Emitter<{
        open: [OpenProps]
        close: [CloseProps]
        abort: [Error]
    }>()

    private onOpen: ReturnType<T>['open'] | undefined
    private onClose: ReturnType<T>['close'] | undefined
    private onAbort: ReturnType<T>['abort'] | undefined

    private dispatchPeek: ReturnType<T>['peek'] | undefined
    private dispatchOpen: ReturnType<T>['open'] | undefined
    private dispatchClose: ReturnType<T>['close'] | undefined
    private dispatchAbort: ReturnType<T>['abort'] | undefined

    /**
     * Peek the open state of the React modal component.
     */
    get opened() {
        return this.dispatchPeek?.() ?? false
    }

    /**
     * Register a React modal component that implemented a forwarded ref.
     * The ref item should be fed with open and close methods.
     */
    register = (creator: T | null) => {
        if (!creator) {
            this.dispatchOpen = undefined
            this.dispatchClose = undefined
            this.dispatchAbort = undefined
            return
        }

        const ref = creator(
            (props) => this.onOpen?.(props),
            (props) => this.onClose?.(props),
            (error) => this.onAbort?.(error),
        )
        this.dispatchPeek = ref.peek
        this.dispatchOpen = ref.open
        this.dispatchClose = ref.close
        this.dispatchAbort = ref.abort
    }

    /**
     * Open the registered modal component with props
     * @param props
     */
    open = (props: OpenProps) => {
        this.emitter.emit('open', props)
        this.dispatchOpen?.(props)
    }

    /**
     * Close the registered modal component with props
     * @param props
     */
    close = (props: CloseProps) => {
        this.emitter.emit('close', props)
        this.dispatchClose?.(props)
    }

    /**
     * Abort the registered modal component with Error
     */
    abort = (error: Error) => {
        this.emitter.emit('abort', error)
        this.dispatchAbort?.(error)
    }

    /**
     * Open the registered modal component and wait for it closes
     * @param props
     */
    openAndWaitForClose = (props: OpenProps): Promise<CloseProps> => {
        return new Promise<CloseProps>((resolve, reject) => {
            this.open(props)

            this.onClose = (props) => resolve(props)
            this.onAbort = (error) => reject(error)
        })
    }
}
