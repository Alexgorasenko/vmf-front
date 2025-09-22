import React from 'react'

import Achievement from "./index";

export default {
    title: 'Achievement',
    component: Achievement
}

const Template = (args) => <Achievement {...args}/>

export const Career = Template.bind({});
Career.args = {
    size: 100,
    sample: 'career',
    scope: 'goals',
    value: 100,
    grade: 1
}

export const Team = Template.bind({});
Team.args = {
    size: 100,
    sample: 'team',
    scope: 'goals',
    value: 100,
    grade: 1
}

export const Tournament = Template.bind({});
Tournament.args = {
    size: 100,
    sample: 'tournament',
    scope: 'goals',
    value: 100,
    grade: 1
}