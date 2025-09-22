import React from 'react'

import EventsAndRequestsBlock from "./";

export default {
    title: 'Events & Requests',
    component: EventsAndRequestsBlock
}

const Template = args => <EventsAndRequestsBlock {...args} />

export const Default = Template.bind({});
Default.args = {
    matches: [
        {
            _id: '1',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '2',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '3',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '4',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '5',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '6',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '7',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '8',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        },
        {
            _id: '9',
            homeTeam: 'Миллион Роз',
            awayTeam: 'Фортуна',
            info: {
                HGoals: 4,
                AGoals: 7
            }
        }
    ]
}