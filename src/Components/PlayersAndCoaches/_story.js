import React from 'react'

import PlayersAndCoaches from "./index";

export default {
    title: 'PlayersAndCoaches',
    component: PlayersAndCoaches
}

const Template = args => <PlayersAndCoaches {...args}/>

export const Default = Template.bind({});