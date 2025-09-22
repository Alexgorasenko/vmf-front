import React, { useContext } from 'react'

import { WorkspaceContext } from '../../../ctx'
import Lottie from 'react-lottie'
import * as animationData from './play-pulse.json'
import { contents } from '../contents'

import './style.scss'

import { ENDPOINT } from '../../../env'
import axios from 'axios'

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animationData
}

const paths = {
    '/': 'editmatch',
    '/structure': 'structure',
    '/tournaments': 'tournaments',
    '/clubs': 'clubs',
    '/manageclub': 'manageclub',
    '/?view=inbox': 'inbox',
    '/players-and-coaches': 'players',
    '/publications': 'publications'
}

const TipTrigger = ({ layout }) => {
    const ctx = useContext(WorkspaceContext)
    const { subject } = ctx.workspace
    //console.log('TipTrigger', window.location.pathname+''+window.location.search, 'subject', subject)
    const pathKey = paths[window.location.pathname+''+window.location.search]
    const content = subject ? contents[subject.type][pathKey] : null

    const handleClick = pk => {
        const watched = subject.tipsFlow && subject.tipsFlow.includes(pathKey)
        const upd = watched ? null : [...(subject.tipsFlow || []), pk]

        ctx.setWorkspace({...ctx.workspace, tip: [subject.type, pathKey], subject: upd ? {...ctx.workspace.subject, tipsFlow: upd} : ctx.workspace.subject})
        if(upd) {
            axios.put(`${ENDPOINT}v2/scopes/${subject.scopeId}`, {tipsFlow: upd}, {
                headers: {
                    Authorization: subject.token
                }
            })
        }
    }

    return  content && (layout !== 'mobile') ? (
                <div
                    className='tip-trigger'
                    onClick={() => handleClick(pathKey)}
                >
                    <Lottie
                        options={defaultOptions}
                        width={80}
                    />

                    <div className='notice'>
                        <span>Есть вопросы?</span>
                        <p>Посмотрите небольшое видео об этом разделе</p>
                    </div>
                </div>
            ) : null
}

export default TipTrigger
