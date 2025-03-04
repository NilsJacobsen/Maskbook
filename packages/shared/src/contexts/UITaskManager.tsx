import { createContext, createElement, type ComponentType, type PropsWithChildren, useMemo, useState } from 'react'
import { defer, type DeferTuple } from '@masknet/kit'
import { EMPTY_LIST } from '@masknet/shared-base'
import type { InjectedDialogProps } from './components/index.js'

export interface ContextOptions<Options, Result> {
    show(options?: Omit<Options, 'open'>, signal?: AbortSignal): Promise<Result>
}

export interface BaseDialogProps<T> extends Pick<InjectedDialogProps, 'open' | 'onClose'> {
    onSubmit?(result: T | null): void
}

/**
 * Create a manager of small UI task sessions,
 * which provides both a Context and a Provider.
 */
export const createUITaskManager = <TaskOptions extends BaseDialogProps<Result>, Result>(
    Component: ComponentType<TaskOptions>,
) => {
    const TaskManagerContext = createContext<ContextOptions<TaskOptions, Result | null>>(null!)
    TaskManagerContext.displayName = `TaskManagerContext (${Component.displayName || Component.name})`
    let id = 0

    type TaskDeferTuple = DeferTuple<Result | null>
    interface Task {
        id: number
        promise: Promise<Result | null>
        resolve: TaskDeferTuple[1]
        reject: TaskDeferTuple[2]
        options?: Omit<TaskOptions, 'open'>
    }

    function TaskManagerProvider({ children }: PropsWithChildren<{}>) {
        const [tasks, setTasks] = useState<Task[]>(EMPTY_LIST)

        const contextValue = useMemo(() => {
            const removeTask = (id: number) => {
                setTasks((list) => list.filter((t) => t.id !== id))
            }

            return {
                show(options?: Omit<TaskOptions, 'open'>, signal?: AbortSignal) {
                    const [promise, resolve, reject] = defer<Result | null>()
                    id += 1
                    signal?.addEventListener('abort', function abortHandler() {
                        resolve(null)
                        signal.removeEventListener('abort', abortHandler)
                    })
                    const newTask: Task = { id, promise, resolve, reject, options }
                    setTasks((list) => [...list, newTask])
                    promise.then(() => {
                        removeTask(newTask.id)
                    })
                    return promise
                },
            }
        }, [])

        return (
            <TaskManagerContext.Provider value={contextValue}>
                {children}
                {tasks.map((task) => {
                    return createElement(Component, {
                        ...task.options,
                        key: task.id,
                        open: true,
                        onSubmit: (result: Result | null) => {
                            task.options?.onSubmit?.(result)
                            task.resolve(result)
                        },
                        onClose: () => {
                            task.resolve(null)
                        },
                    } as unknown as TaskOptions)
                })}
            </TaskManagerContext.Provider>
        )
    }
    return { TaskManagerContext, TaskManagerProvider }
}
