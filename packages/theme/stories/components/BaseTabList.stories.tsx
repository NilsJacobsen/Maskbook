import { TabContext, TabPanel } from '@mui/lab'
import { Stack, Tab } from '@mui/material'
import { useState } from 'react'
import { MaskTabList, type MaskTabListProps } from '../../src/index.js'
import { story } from '../utils/index.js'

const defaultTabs = ['One', 'Two', 'Three']
const { meta, of } = story(function ({
    tabs,
    ...rest
}: {
    tabs: string[]
} & MaskTabListProps) {
    const [state, setState] = useState(tabs[0])
    return (
        <Stack
            p={3}
            sx={{
                background:
                    'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 100%), linear-gradient(90deg, rgba(98, 152, 234, 0.2) 1.03%, rgba(98, 152, 234, 0.2) 1.04%, rgba(98, 126, 234, 0.2) 100%)',
            }}>
            <TabContext value={tabs.includes(state) ? state : tabs[0]}>
                <MaskTabList variant="base" {...rest} onChange={(e, v) => setState(v)} aria-label="base tabs">
                    {tabs.map((x) => (
                        <Tab key={x} value={x} label={x} />
                    ))}
                </MaskTabList>
                {tabs.map((x) => (
                    <TabPanel key={x} value={x}>
                        Tab {x}
                    </TabPanel>
                ))}
            </TabContext>
        </Stack>
    )
})

export default meta({
    title: 'Components/Tab List/Base',
    argTypes: {},
})

export const BaseTabsList = of({
    args: { tabs: defaultTabs, disabled: false, fullWidth: false },
})
