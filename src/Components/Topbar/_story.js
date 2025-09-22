import React from 'react'

import Topbar from './'

export default {
  title: 'Топбар',
  component: Topbar,
  argTypes: {
      layout: {
          options: ['desktop', 'tablet', 'mobile'],
          type: 'radio'
      }
  }
}

const Template = (args) => <Topbar {...args} />

export const Default = Template.bind({});
Default.args = {
    title: 'События и запросы',
    layout: 'desktop'
}

// export const Backdroped = Template.bind({});
// Backdroped.args = {
//     source: 'https://amateum.fra1.digitaloceanspaces.com/clubs/ole/5568.png',
//     backdroped: true,
//     size: 'md'
// }

// export const ClubDesktop = Template.bind({})
// Secondary.args = {
//   label: 'Button',
// }
