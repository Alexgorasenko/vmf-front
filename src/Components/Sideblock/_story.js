import React from 'react'

import Sideblock from './'

export default {
  title: 'Боковое меню',
  component: Sideblock,
  // argTypes: {
  //     backgroundColor: { control: 'color' },
  // }
}

const Template = (args) => <Sideblock {...args} />

export const DesktopCompact = Template.bind({});
DesktopCompact.args = {
    theme: 'indigo',
    subject: {
        type: 'league',
        name: 'Ole Sports'
    },
    compact: true
}

export const CompactCollapsed = Template.bind({});
CompactCollapsed.args = {
    theme: 'indigo',
    subject: {
        type: 'league',
        name: 'Ole Sports'
    },
    compact: true,
    collapsed: true
}

export const LeagueDesktop = Template.bind({});
LeagueDesktop.args = {
    theme: 'indigo',
    subject: {
        type: 'league',
        name: 'Ole Sports'
    }
}
