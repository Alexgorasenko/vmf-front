import React, { useContext, useState, useEffect } from 'react'
import { ToolbarContext } from './ctx'

import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { ProgressBar } from 'primereact/progressbar'

import { CustomInput } from '../Atoms'

import './style.scss'

import moment from 'moment'

const Inbox = ({ subject }) => {
    const ctx = useContext(ToolbarContext)
    const { toolbar, setFilter, setToolbar } = ctx

    const items = [
        {label: 'Лента матчей', id: 'matches', icon: 'pi pi-fw pi-bolt'},
        {label: 'Изменения составов', id: 'inbox', icon: 'pi pi-fw pi-users', view: 'inbox'},
    ]

    const rangeBtns = [
        {label: 'Любые', name: 'all'},
        {label: 'Заявки', name: 'squad'},
        {label: 'Дозаявки', name: 'addon'},
        {label: 'Создание клубов', name: 'club'}
    ]

    const rangeBtns2 = [
        {label: 'Новые', name: 'inbox'},
        {label: 'Обработанные', name: 'handled'}
    ]

    useEffect(() => {
        setToolbar({
            ...toolbar,
            filters: {
                ...toolbar.filters,
                rangeBtn: rangeBtns[2].name,
                rangeBtn2: 'inbox',
                value: ''
            }
        })
    }, [])

    const CustomTabMenu = () => {
        return  <div className='custom-tabs' style={{justifyContent: 'flex-start'}}>
                    {items.map((i, idx) => (
                        <div
                            className={`custom-tabs_btn ${idx === toolbar.filters.activeIndex ? ' active' : ''}`}
                            key={idx}
                            onClick={() => setFilter('activeIndex', idx)}
                        >
                            <i className={i.icon}></i>
                            <span>{i.label}</span>
                        </div>
                    ))}
                </div>
    }

    return  subject && subject.type !== 'club' ? [
                <CustomTabMenu model={items} />,
                <div className='btn-group'>
                    {rangeBtns.map((btn, idx) => (
                        <Button
                            key={`range_btn_${idx}`}
                            label={btn.label}
                            className={`p-button p-button-sm ${btn.name !== toolbar.filters.rangeBtn ? 'p-button-outlined' : ''} p-button-info`}
                            onClick={() => setFilter('rangeBtn', btn.name)}
                        />
                    ))}
                </div>,
                <div className='btn-group'>
                    {rangeBtns2.map((btn, idx) => (
                        <Button
                            key={`range_btn_${idx}`}
                            label={btn.label}
                            className={`p-button p-button-sm ${btn.name !== toolbar.filters.rangeBtn2 ? 'p-button-outlined' : ''} p-button-info`}
                            onClick={() => setFilter('rangeBtn2', btn.name)}
                        />
                    ))}
                </div>,
                <div className={'search'}>
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText key='search' value={toolbar.filters.value} onChange={(e) => setFilter('value', e.target.value)} placeholder="Поиск по команде / турниру" style={{width: '18vw'}}/>
                    </span>
                </div>
            ] : null
}

const Matches = ({ subject }) => {
    const ctx = useContext(ToolbarContext)
    const { toolbar, setFilter, setToolbar } = ctx

    const items = [
        {label: 'Лента матчей', id: 'matches', icon: 'pi pi-fw pi-bolt'},
        {label: 'Изменения составов', id: 'inbox', icon: 'pi pi-fw pi-users', view: 'inbox'},
    ]

    const rangeBtns = [
        {label: 'За месяц', range: {min: moment().add(-30, 'days').format('YY-MM-DD'), max: moment().format('YY-MM-DD')}},
        {label: 'За неделю', range: {min: moment().add(-7, 'days').format('YY-MM-DD'), max: moment().format('YY-MM-DD')}},
        {label: 'Вчера', range: {min: moment().add(-1, 'days').format('YY-MM-DD'), max: moment().add(-1, 'days').format('YY-MM-DD')}},
        {label: 'Сегодня', range: {min: moment().format('YY-MM-DD'), max: moment().format('YY-MM-DD')}},
        {label: 'Завтра', range: {min: moment().add(1, 'days').format('YY-MM-DD'), max: moment().add(1, 'days').format('YY-MM-DD')}}
    ]

    useEffect(() => {
        setToolbar({
            ...toolbar,
            filters: {
                activeIndex: 0,
                rangeBtn: rangeBtns[3],
                value: ''
            }
        })
    }, [])

    const CustomTabMenu = () => {
        return  <div className='custom-tabs' style={{justifyContent: 'flex-start'}}>
                    {items.map((i, idx) => (
                        <div
                            className={`custom-tabs_btn ${idx === toolbar.filters.activeIndex ? ' active' : ''}`}
                            key={idx}
                            onClick={() => setFilter('activeIndex', idx)}
                        >
                            <i className={i.icon}></i>
                            <span>{i.label}</span>
                        </div>
                    ))}
                </div>
    }

    return subject && subject.type !== 'club' ? [
        <CustomTabMenu model={items} />,
        <div className='btn-group'>
            {rangeBtns.map((btn, idx) => (
                <Button
                    key={`range_btn_${idx}`}
                    label={btn.label}
                    className={`p-button p-button-sm ${toolbar.filters.rangeBtn && btn.label !== toolbar.filters.rangeBtn.label ? 'p-button-outlined' : ''} p-button-info`}
                    onClick={() => setFilter('rangeBtn', {...btn})}
                />
            ))}
        </div>,
        <div className={'search'}>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText key='search' value={toolbar.filters.value} onChange={(e) => setFilter('value', e.target.value)} placeholder="Поиск по команде / турниру / стадиону" />
            </span>
        </div>
    ] : null
}

const Schedule = ({ subject }) => {
    const defaultRangeBtn = {label: 'Текущая неделя', range: {min: moment().subtract(0, 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(0, 'weeks').endOf('isoWeek').format('YY-MM-DD')}}
    const ctx = useContext(ToolbarContext)
    const { toolbar, setFilter, setToolbar } = ctx

    const [rangeBtns, setRangeBtns] = useState([
        {label: `${moment().subtract(1, 'weeks').startOf('isoWeek').format('DD.MM')} - ${moment().subtract(1, 'weeks').endOf('isoWeek').format('DD.MM')}`, range: {min: moment().subtract(1, 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(1, 'weeks').endOf('isoWeek').format('YY-MM-DD')}},
        {label: 'Текущая неделя', range: {min: moment().subtract(0, 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(0, 'weeks').endOf('isoWeek').format('YY-MM-DD')}},
        {label: `${moment().subtract(-1, 'weeks').startOf('isoWeek').format('DD.MM')} - ${moment().subtract(-1, 'weeks').endOf('isoWeek').format('DD.MM')}`, range: {min: moment().subtract(-1, 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(-1, 'weeks').endOf('isoWeek').format('YY-MM-DD')}}
    ])

    const [rangeBtn, setRangeBtn] = useState(defaultRangeBtn)
    const [rangePeriod, setRangePeriod] = useState(0)

    const items = [
        {label: 'Расписание матчей', id: 'schedule', icon: 'pi pi-fw pi-star'},
        {label: 'Назначения персонала', id: 'staff', icon: 'pi pi-fw pi-bolt'}
    ]

    useEffect(() => {
        setToolbar({
            ...toolbar,
            filters: {
                activeIndex: 0,
                rangeStages: null,
                rangeBtn: rangeBtns[1]
            }
        })
    }, [])

    useEffect(() => {
        setFilter('rangeBtn', rangeBtn)
    }, [rangeBtn])

    const setPeriod = (btn) => {
        const period = rangeBtns.map((rb, index) => {
            if (rb.label === btn.label){
                switch (index) {
                    case 0:
                        setRangePeriod(prevState => prevState - 1)
                        return rangePeriod - 1
                    case 1:
                        setRangePeriod(rangePeriod)
                        return rangePeriod
                    case 2:
                        setRangePeriod(prevState => prevState + 1)
                        return rangePeriod +1
                }
            }
        }).filter(value => value !== undefined)
        setRangeBtns([
            {label: `${moment().subtract(1-period[0], 'weeks').startOf('isoWeek').format('DD.MM')} - ${moment().subtract(1-period[0], 'weeks').endOf('isoWeek').format('DD.MM')}`, range: {min: moment().subtract(1-period[0], 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(1-period[0], 'weeks').endOf('isoWeek').format('YY-MM-DD')}},
            {...btn},
            {label: `${moment().subtract(-1-period[0], 'weeks').startOf('isoWeek').format('DD.MM')} - ${moment().subtract(-1-period[0], 'weeks').endOf('isoWeek').format('DD.MM')}`, range: {min: moment().subtract(-1-period[0], 'weeks').startOf('isoWeek').format('YY-MM-DD'), max: moment().subtract(-1-period[0], 'weeks').endOf('isoWeek').format('YY-MM-DD')}}
        ])
        setRangeBtn(btn)
    }

    const CustomTabMenu = () => {
        return  <div className='custom-tabs' style={{justifyContent: 'flex-start'}}>
                    {items.map((i, idx) => (
                        <div
                            className={`custom-tabs_btn ${idx === toolbar.filters.activeIndex ? ' active' : ''}`}
                            key={idx}
                            onClick={() => setFilter('activeIndex', idx)}
                        >
                            <i className={i.icon}></i>
                            <span>{i.label}</span>
                        </div>
                    ))}
                </div>
    }

    return subject && subject.type !== 'club' ? [
        <CustomTabMenu model={items} />,
        toolbar && toolbar.data && toolbar.data.stages ? (
            <CustomInput
                type='dropdown'
                icon='pi pi-bolt'
                optionLabel='title'
                value={toolbar.filters.rangeStages ? toolbar.filters.rangeStages._id : null}
                options={toolbar.data.stages.map(s => ({...s, value: s._id}))}
                onChange={(e) => setFilter('rangeStages', toolbar.data.stages.find(s => s._id === e))}
            />
        ) : null,
        toolbar && toolbar.data && toolbar.data.stats ? (
            <div className='over-list'>
                <div className='stage-progress'>
                    <span className='label'>всего матчей / не запланировано</span>
                    <ProgressBar
                        value={100 - Math.floor((toolbar.data.stats[0]/toolbar.data.stats[1])*100)}
                        displayValueTemplate={val => (
                            <React.Fragment>{toolbar.data.stats[1]+' / '+toolbar.data.stats[0]}</React.Fragment>
                        )}
                    />
                </div>
            </div>
        ) : null,
        <div className='btn-group'>
            {rangeBtns.map((btn, idx) => (
                <Button
                    key={`range_btn_${idx}`}
                    label={btn.label}
                    className={`p-button p-button-sm ${btn.label !== rangeBtn.label ? 'p-button-outlined' : ''} p-button-info`}
                    onClick={() => setPeriod({...btn})}
                />
            ))}
        </div>
    ] : null
}

const Tournaments = ({ subject }) => {
    const items = [
        {label: 'Настройки', id: 'settings', icon: 'pi pi-fw pi-cog'},
        {label: 'Команды', id: 'teams', icon: 'pi pi-fw pi-star'},
        {label: 'Структура и календарь', id: 'structure', icon: 'pi pi-fw pi-calendar'},
        //{label: 'Календарь', id: 'calendar', icon: 'pi pi-fw pi-calendar'},
        {label: 'Площадки и время', id: 'locationAndTime', icon: 'pi pi-fw pi-map-marker'},
        //{label: 'Графика и соцсети', id: 'social', icon: 'pi pi-fw pi-palette'},
        {label: 'Дисквалификации', id: 'disquals', icon: 'pi pi-fw pi-ban'},
        {label: 'Сборная лучших игроков', id: 'dreamLineups', icon: 'pi pi-fw pi-thumbs-up'}
    ]

    const ctx = useContext(ToolbarContext)
    const { toolbar, setFilter, setToolbar } = ctx

    useEffect(() => {
        setFilter('tab', 'settings')
    }, [])

    const CustomTabMenu = () => {
        return  <div className='custom-tabs' style={{justifyContent: 'flex-start'}}>
                    {items.map((i, idx) => (
                        <div
                            className={`custom-tabs_btn ${i.id === toolbar.filters.tab ? ' active' : ''}`}
                            key={idx}
                            onClick={() => setFilter('tab', i.id)}
                        >
                            <i className={i.icon}></i>
                            <span>{i.label}</span>
                        </div>
                    ))}
                </div>
    }

    return  subject && subject.type !== 'club' ? [
        <CustomTabMenu model={items} />
    ] : null
}

const paths = {
    '/': [Matches, Inbox],
    '/schedule': Schedule,
    '/tournaments': Tournaments
}

const Toolbar = ({ subject }) => {
    const ctx = useContext(ToolbarContext)
    const { filters } = ctx.toolbar

    const pathContent = paths[window.location.pathname]
    const Specified = pathContent && filters && Array.isArray(pathContent) ? typeof(filters.activeIndex) !== 'undefined' ? pathContent[filters.activeIndex] : pathContent[0] : (pathContent || null)

    return  Specified ? (
                <div className='page-toolbar'>
                    <div className='container'>
                        <Specified subject={subject} />
                    </div>
                </div>
            ) : null

}

export default Toolbar
