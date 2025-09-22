import React, { useState, useEffect, useContext } from 'react'

import { ToolbarContext } from '../Toolbar/ctx'

import './style.scss'
import { TabMenu } from 'primereact/tabmenu';

import Matches from './Matches'

import {matches} from "@testing-library/jest-dom/dist/utils"
import {classNames} from "primereact/utils";
import {Link, useHistory, useLocation} from "react-router-dom";
import Inbox from "./Inbox";

const components = {
    matches: Matches,
    inbox: Inbox,
    payments: null
}

const EventsAndRequestsBlock = ({ subject, layout }) => {
    const [tab, setTab] = useState(layout === 'mobile'|| window.location.search.includes('inbox') ? 'inbox' : 'matches')
    const [tabIndex, setTabIndex] = useState(layout === 'mobile' || window.location.search.includes('inbox') ? 1 : 0)

    const tctx = useContext(ToolbarContext)
    const { toolbar } = tctx

    const history = useHistory()

    const onClickTab = (e) => {
        history.push(e.value.view ? `${window.location.pathname}?view=${e.value.view}` : window.location.pathname)

        setTab(e.value.id)
        setTabIndex(e.index)
    }

    const Specified = toolbar && toolbar.filters ? Object.entries(components)[toolbar.filters.activeIndex] ? Object.entries(components)[toolbar.filters.activeIndex][1] || null : null : null

    return (
        <div className={'events-requests'}>
            {Specified ? <Specified subject={subject} layout={layout} /> : null}
        </div>
    );
}

export default EventsAndRequestsBlock
