import React, { useState, useEffect, useContext } from 'react'
import { useHistory } from 'react-router-dom'

import { WorkspaceContext } from '../../ctx'

import Switcher from './Switcher'
import Menu from './Menu'

import { Button } from 'primereact/button'

import './style.scss'

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

const menus = [
    [
        {label: 'События и запросы', icon: 'inbox', path: '/'},
        {label: 'Расписание', icon: 'calendar-plus', path: '/schedule', hasDD: true},
        {label: 'Управление турнирами', icon: 'star', path: '/tournaments', hasDD: true},
        {label: 'Клубы и команды', icon: 'shield', path: '/clubs'},
        {label: 'Игроки и тренеры', icon: 'id-card', path: '/players-and-coaches'}
    ],
    [
        {label: 'Структура', icon: 'sitemap', path: '/structure'},
        {label: 'Персонал', icon: 'users', path: '/staff'},
        {label: 'Площадки', icon: 'map-marker', path: '/locations'}
    ],
    [
        {label: 'Публикации', icon: 'image', path: '/publications'},
        {label: 'Внешний вид', icon: 'palette', path: '/appearance'},
        {label: 'Скачать графику', icon: 'instagram', path: '/renders'}
    ],
    [
        {label: 'Поддержка', icon: 'comments', command: () => window.open('https://t.me/mk_amateum', '_blank')},
        {label: 'Выйти из аккаунта', icon: 'lock', command: () => {
            localStorage.removeItem('_amateum_uid');
            localStorage.removeItem('_amateum_subject_tkn');
            localStorage.removeItem('_amateum_tkn');
            setTimeout(() => {
                window.location.reload()
            }, 300)}
        }
    ]
]

const compactMenus = [
    [
        {label: 'События и запросы', icon: 'inbox', path: '/'},
        {label: 'Лента матчей (LIVE)', icon: 'bolt', path: '/live'},
        //{label: 'Расписание', icon: 'calendar-plus', path: '/schedule', hasDD: true},
        {label: 'Управление турнирами', icon: 'star', path: '/tournaments', hasDD: true},
        {label: 'Клубы и команды', icon: 'shield', path: '/clubs'},
        {label: 'Игроки и тренеры', icon: 'id-card', path: '/players-and-coaches'}
    ],
    [
        {label: 'Структура', icon: 'sitemap', path: '/structure'},
        {label: 'Персонал', icon: 'users', path: '/staff'},
        {label: 'Площадки', icon: 'map-marker', path: '/locations'}
    ],
    // [
    //     {label: 'Медиа и публикации', icon: 'image', path: '/publications'},
    //     {label: 'Внешний вид', icon: 'palette'}
    // ],
    [
        {label: 'Скачать графику', icon: 'instagram', path: '/renders'}
    ],
    [
        {label: 'Поддержка', icon: 'comments', command: () => window.open('https://t.me/mk_amateum', '_blank')},
        {label: 'Выйти из аккаунта', icon: 'lock', command: () => {
                localStorage.removeItem('_amateum_uid');
                localStorage.removeItem('_amateum_subject_tkn');
                localStorage.removeItem('_amateum_tkn');
                setTimeout(() => {
                    window.location.reload()
                }, 300)}
        }
    ]
]

const clubMenus = [
    // [
    //     {label: 'Матчи LIVE', icon: 'bolt', path: '/live'},
    //     {label: 'События и запросы', icon: 'inbox', path: '/?view=inbox'},
    //     {label: 'Управление клубом', icon: 'shield', path: '/manageclub'},
    //     {label: 'Игроки и тренеры', icon: 'id-card', path: '/players-and-coaches'}
    // ],
    // [
    //     {label: 'Контент и соц.сети', icon: 'image'}
    // ],
    [
        {label: 'Поддержка', icon: 'comments', command: () => window.open('https://t.me/mk_amateum', '_blank')},
        {label: 'Выйти из аккаунта', icon: 'lock', command: () => {
                localStorage.removeItem('_amateum_uid');
                localStorage.removeItem('_amateum_subject_tkn');
                localStorage.removeItem('_amateum_tkn');
                setTimeout(() => {
                    window.location.reload()
                }, 300)}
        }
    ]
]
const employeeMenus = []
const adminMenus = [
    [
        {label: 'Управление федерациями', icon: 'star', path: '/federations'},
        {label: 'Админы', icon: 'id-card', path: '/users'}
    ],
    []
]

const getMenuType = (type, compact=false) => {
    let m = [];

    switch (true) {
        case type === 'club':
            m = clubMenus
            break;
        case type === 'federation':
            if (compact) {
                m = compactMenus
            } else {
                m = menus
            }
            break;
        case type === 'employee':
            m = employeeMenus
            break;
        case type === 'superAdmin':
            m = adminMenus
            break;
        default:
            break
    }
    return m
}

const Sideblock = ({ subject, theme, compact, collapsed, toggleCollapsedSide, toggleShownMenu, userTkn, onSubjectChanged, onProfileChanged, onTitleChanged }) => {
    const [active, setActive] = useState([0, 0])
    const [activeSubjectType, setActiveSubjectType] = useState(subject ? subject.type : null)
    const [menuSource, setMenuSource] = useState(subject ? getMenuType(subject.type) : [])

    const ctx = useContext(WorkspaceContext)
    const history = useHistory()

    useEffect(() => {
        if(subject) {
            if(activeSubjectType && (subject.type !== activeSubjectType)) {
                if (subject.type === 'superAdmin') {
                    history.push('/federations')
                } else {
                    history.push('/')
                }
                setActive([0, 0])
            }

            setActiveSubjectType(subject.type)
            setMenuSource(subject ? getMenuType(subject.type, compact) : [])
            ctx.setWorkspace({...ctx.workspace, subject: subject})
        }
    }, [subject])

    useEffect(() => {
        if(menuSource[active[0]] && menuSource[active[0]][active[1]]) {
            onTitleChanged(menuSource[active[0]][active[1]].label)
            if(!menuSource[active[0]][active[1]].hasDD) {
                ctx.setWorkspace({...ctx.workspace, topDropdown: null})
            }
        }
    }, [active])

    useEffect(() => {
        const { pathname } = window.location
        let sectionIdx, itemIdx
        menuSource.map((sect, i) => {
            const _itemIdx = sect.findIndex(item => item.path === pathname)
            if(_itemIdx > -1) {
                sectionIdx = i
                itemIdx = _itemIdx
            }
        })

        if(sectionIdx > -1) {
            setActive([sectionIdx, itemIdx])
        }
    }, [menuSource])

    return  <div className={'sideblock'+(compact ? ' compact' : '')+(collapsed ? ' collapsed' : '')} style={{backgroundColor: `var(--${theme}-900)`}}>
                <Switcher
                    onSubjectChanged={onSubjectChanged}
                    onProfileChanged={onProfileChanged}
                    collapsed={collapsed}
                    toggleCollapsedSide={toggleCollapsedSide}
                    userTkn={userTkn}
                />
                {menuSource.map((m, idx) => (
                    <Menu
                        loading={!subject}
                        collapsed={collapsed}
                        key={idx}
                        data={m}
                        menuIdx={idx}
                        isLast={idx === (menuSource.length - 1)}
                        active={active}
                        setActive={arr => {
                            setActive(arr)
                            if(toggleShownMenu) {
                                setTimeout(() => {
                                    toggleShownMenu()
                                }, 400)
                            } else if(collapsed === false && compact) {
                                toggleCollapsedSide()
                            }
                        }}
                    />
                ))}

                {compact && (collapsed === false) ? (
                    <Button
                        className='p-button p-button-text p-button-rounded collapse-trigger'
                        icon='pi pi-times'
                        onClick={() => toggleShownMenu()}
                    />
                ) : null}
            </div>
}

export default Sideblock
