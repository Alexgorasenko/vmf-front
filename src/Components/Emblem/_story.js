import React from 'react'

import Emblem from './'

export default {
  title: 'Эмблемы',
  component: Emblem,
  argTypes: {
      size: {
          options: ['xl', 'lg', 'md', 'sm', 'xs'],
          type: 'radio'
      }
  }
}

const Template = (args) => <Emblem {...args} />

export const Clean = Template.bind({});
Clean.args = {
    source: 'https://amateum.fra1.digitaloceanspaces.com/clubs/ole/5568.png',
    backdroped: false,
    size: 'md'
}

export const Backdroped = Template.bind({});
Backdroped.args = {
    source: 'https://amateum.fra1.digitaloceanspaces.com/clubs/ole/5568.png',
    backdroped: true,
    size: 'md'
}

// export const ClubDesktop = Template.bind({})
// Secondary.args = {
//   label: 'Button',
// }
