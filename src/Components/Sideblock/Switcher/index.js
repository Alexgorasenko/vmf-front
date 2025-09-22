import React, { useState, useEffect, useRef, useContext } from 'react'

import { useHistory } from 'react-router-dom'
import { WorkspaceContext } from '../../../ctx'

import { Skeleton } from 'primereact/skeleton'
import { Menu } from 'primereact/menu'
import Emblem from '../../Emblem'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../env'

const getIndex = {
    'federation': {
        index: 0,
        title: 'лигой'
    },
    'club' : {
        index: 1,
        title: 'клубом'
    },
    'employee': {
        index: 2,
        title: 'сотрудником'
    },
    'superAdmin': {
        index: 3,
        title: ''
    }
}

const reduceOptions = (arr, setter) => {
    return arr.reduce((acc, opt) => {
        const index = getIndex[opt.type] ? getIndex[opt.type].index : null
        if (typeof(index) === 'number') {
            acc[index].items.push({
                label: opt.name,
                icon: <Emblem size='xs' source={opt.emblem} /> ,
                command: (e) => {
                    setter({...opt})
                    //console.log('Setting subj tkn', opt.token)
                    localStorage.setItem('_amateum_subject_tkn', opt.token)
                }
            })

            return acc
        }
    }, [
        {label: 'Лиги', items: []},
        {label: 'Клубы', items: []},
        {label: 'Сотрудник', items: []},
        {label: 'Админ', items: []},
    ]).filter(cat => cat.items && cat.items.length)
}

const Switcher = ({ collapsed, toggleCollapsedSide, userTkn, onSubjectChanged, onProfileChanged }) => {
    const [options, setOptions] = useState(null)
    const [selected, setSelected] = useState(null)

    const menuRef = useRef(null)
    const history = useHistory()

    const wctx = useContext(WorkspaceContext)

    useEffect(() => {
        if(userTkn) {
            axios.get(`${ENDPOINT}v2/init`, {
                headers: {
                    SignedBy: userTkn
                }
            }).then(resp => {
                setOptions(resp.data.scopes)
                onProfileChanged(resp.data.profile)
                const currentSubjectTkn = localStorage.getItem('_amateum_subject_tkn')
                let subj;

                if(resp.data.profile) {
                    localStorage.setItem('_amateum_uid', resp.data.profile.userId)
                }

                if(!currentSubjectTkn) {
                    if(resp.data.scopes[0]) {
                        subj = {...resp.data.scopes[0]}
                        setSelected(subj)

                        localStorage.setItem('_amateum_subject_tkn', resp.data.scopes[0].token)
                    } else {
                        alert('Access error')
                    }
                } else {
                    const matched = resp.data.scopes.find(sub => sub.token === currentSubjectTkn)
                    if(matched) {
                        subj = {...matched}
                        setSelected(subj)
                    } else {
                        if(resp.data.scopes[0]) {
                            subj = {...resp.data.scopes[0]}
                            setSelected(subj)
                            localStorage.setItem('_amateum_subject_tkn', resp.data.scopes[0].token)
                        } else {
                            alert('Access error')
                        }
                    }
                }
                wctx.setWorkspace({...wctx.workspace, subject: subj || null})
            })
        }
    }, [userTkn])

    useEffect(() => {
        if(selected && selected.token) {
            //console.log('selected', selected);
            const curToken = localStorage.getItem('_amateum_subject_tkn')
            localStorage.setItem('_amateum_subject_tkn', selected.token)
            //const patchContext = {subject: selected}
            //если есть рестрикшн - го в лайв
            if(selected.onlyLiveMode && selected.type === 'federation') {
                wctx.setWorkspace({...wctx.workspace, onlyLiveMode: true, subject: selected})
                history.push('/live')
            } else if(selected.type === 'federation') {
                //если первый раз по скоупом федерации - го в структуру
                // axios.get(`${ENDPOINT}v2/list/sheets`, {
                //     headers: {
                //         Authorization: selected.token
                //     }
                // }).then(resp => {
                //     console.log('PUT SHEETS');
                //     wctx.patchContext('sheets', resp.data || [])
                //     //patchContext.sheets = resp.data || []
                // })

                if ((wctx.layoutId !== 'mobile') && !selected.tipsFlow || !selected.tipsFlow.includes('structure')) {
                    axios.put(`${ENDPOINT}v2/scopes/${selected.scopeId}`, {tipsFlow: [...(selected.tipsFlow || []), 'structure']}, {
                        headers: {
                            Authorization: selected.token
                        }
                    })

                    setTimeout(() => {
                        //console.log('first flow');
                        wctx.setWorkspace({...wctx.workspace, subject: selected, tip: ['federation', 'structure']})
                        history.push('/structure')
                    }, 500)
                } else {
                    wctx.setWorkspace({...wctx.workspace, subject: selected})
                    if((!history.location.search.includes("?editmatch") || !(history.location.pathname === "/")) && !(history.location.pathname.includes("/live/")) && !history.location.pathname.includes('/appconfig'))
                        history.push('/')
                }
            } else if (selected.type === 'superAdmin') {
                history.push('/federations')
                wctx.setWorkspace({...wctx.workspace, subject: selected})
            } else {
                history.push('/')
                wctx.setWorkspace({...wctx.workspace, subject: selected})
            }

            onSubjectChanged({...selected})

        }
    }, [selected])

    return  selected ? (
                <div className={'switcher'+(collapsed ? ' collapsed' : '')}>
                    <div
                        className='subject-toggler'
                        onClick={(e) => {
                            if(options && options.length > 1) {
                                menuRef.current.toggle(e)
                            } else {
                                return false
                            }
                        }}
                    >
                        <Emblem backdroped={true} size='md' isClub={selected.type === 'club'} source={selected.emblem} />
                        <div className='subject-name'>{selected.name}</div>
                    </div>
                    <div className='subject-descriptor'>управление  {getIndex[selected.type] ? getIndex[selected.type].title : ''}</div>
                    <div className='collapse-toggle ripple' onClick={toggleCollapsedSide}>
                        <i className='pi pi-bars' style={{fontSize: '1.5em'}}></i>
                    </div>
                    {options ? <Menu className='_in_sideblock' ref={menuRef} popup model={reduceOptions(options, setSelected)} /> : null}
                </div>
            ) : (
                <div className={'switcher'+(collapsed ? ' collapsed' : '')}>
                    <Skeleton shape='square' size='64px' />
                    <div className='subject-name'></div>
                    <div className='subject-descriptor'>загрузка...</div>
                </div>
            )
}

export default Switcher
