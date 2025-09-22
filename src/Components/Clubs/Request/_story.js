import React from 'react'
import Request from "./index";

export default {
    title: 'Club Request',
    component: Request
}

const Template = args => <Request {...args}/>

export const Default = Template.bind({});