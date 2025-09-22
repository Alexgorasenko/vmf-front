import React from 'react'

import Tournaments from "./index";

export default {
    title: 'Tournaments',
    component: Tournaments
}

const Template = args => <Tournaments {...args}/>

export const Default = Template.bind({});