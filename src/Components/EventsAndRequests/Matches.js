import React, { useState, useEffect, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'

import { InputText } from "primereact/inputtext"
import { Button } from "primereact/button"
import { Badge } from 'primereact/badge'
import MatchItem from "./MatchItem"

import { WorkspaceContext } from '../../ctx'
import { ToolbarContext } from '../Toolbar/ctx'

import { NonIdealState } from '../Atoms'

import { ENDPOINT } from '../../env'
import Tablo from '../../assets/img/image6.svg'
import { ProgressSpinner } from 'primereact/progressspinner';

import moment from 'moment'
import axios from 'axios'
import qs from 'qs'

const Matches = ({ subject }) => {
    const [matches, setMatches] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loader, setLoader] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const offset = useRef(0)
    const contentRef = useRef(null)
    const [reached, setReached] = useState(false)
    const [filterTeams, setFilterTeams] = useState(null)
    const [withRefinements, setWithRefinements] = useState(null)
    const [openedMatch, setOpenedMatch] = useState(null)
    const [contentOffset, setContentOffset] = useState(0)

    const ctx = useContext(WorkspaceContext)
    const tbCtx = useContext(ToolbarContext)

    const { toolbar, setFilter } = tbCtx

    useEffect(() => {
        if(contentRef && contentRef.current) {
            const { y } = contentRef.current.getBoundingClientRect()
            if(y !== contentOffset) {
                setContentOffset(y)
            }
        }
    }, [contentRef])

    useEffect(() => {
        if(!filterTeams && subject && subject.type === 'club') {
            setFilterTeams(subject.teams.length > 1 ? 'all' : subject.teams[0]._id)
        }

        if(subject && subject.type === 'federation') {
            axios.get(`${ENDPOINT}v2/list/sheets`, {
                headers: {
                    Authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                //console.log('PUT SHEETS', resp.data);
                ctx.patchContext('sheets', resp.data || [])
                //patchContext.sheets = resp.data || []
            })
            if(!withRefinements) {

                axios.get(`${ENDPOINT}v2/list/refinements`, {
                    headers: {
                        Authorization: localStorage.getItem('_amateum_subject_tkn')
                    }
                }).then(resp => {
                    setWithRefinements(resp.data || [])
                }).catch(e => {
                    setWithRefinements([])
                })
            }
        }
    }, [subject])

    useEffect(() => {
        const { editmatch } = qs.parse(window.location.search.replace('?',''))
        if(editmatch && !openedMatch) {
            setOpenedMatch(editmatch)
        } else if(!editmatch && openedMatch) {
            setOpenedMatch(null)
            if(!toolbar.filters.rangeBtn.range && withRefinements) {
                const filtered = withRefinements.filter(m => m._id !== openedMatch)
                setWithRefinements(filtered)
            }
        }

        if(subject) {
            const tkn = localStorage.getItem('_amateum_subject_tkn')

            if(subject.type !== 'club' && toolbar.filters.rangeBtn && toolbar.filters.rangeBtn.range) {
                setLoading(true)

                const url = `${ENDPOINT}v2/matchesList?startDate=${toolbar.filters.rangeBtn.range.min}&endDate=${toolbar.filters.rangeBtn.range.max}&limit=100&offset=0`
                axios.get(url, {'headers': {'Authorization': tkn}})
                    .then(resp => {
                        if(resp.data){
                            setLoading(false)
                            setMatches(resp.data.matches)
                            if(resp.data.paging) {
                                setCurrentPage(resp.data.paging.currentPage)
                            }
                        }
                    })
            }
        }
    }, [subject, localStorage.getItem('_amateum_subject_tkn'), toolbar.filters.rangeBtn, window.location.search])

    useEffect(() => {
        if(filterTeams) {
            setLoading(true)
            const tkn = localStorage.getItem('_amateum_subject_tkn')

            const url = `${ENDPOINT}v2/matchesList?teamIds=${JSON.stringify(filterTeams === 'all' ? subject.teams.map(t => t._id) : [filterTeams])}&limit=100&offset=${currentPage}`
            axios.get(url, {'headers': {'Authorization': tkn}})
                .then(resp => {
                    if(resp.data){
                        setLoading(false)
                        setCurrentPage(resp.data.paging.currentPage)
                        setReached(false)
                        setMatches([...matches, ...resp.data.matches])
                    }
                })
        }
    }, [filterTeams])

    useEffect(()=>{
        if(reached){
            setLoader(true)
            const tkn = localStorage.getItem('_amateum_subject_tkn')

            const queryBase = filterTeams ? `teamIds=${JSON.stringify(filterTeams === 'all' ? subject.teams.map(t => t._id) : [filterTeams])}` : `startDate=${toolbar.filters.rangeBtn.range.min}&endDate=${toolbar.filters.rangeBtn.range.max}`

            const url = `${ENDPOINT}v2/matchesList?${queryBase}&limit=100&offset=${currentPage}`
            axios.get(url, {'headers': {'Authorization': tkn}})
                .then(resp => {
                    if(resp.data){
                        setLoader(false)
                        setCurrentPage(resp.data.paging.currentPage)
                        setReached(false)
                        setMatches([...matches, ...resp.data.matches])
                    }
                })
        }
    },[localStorage.getItem('_amateum_subject_tkn'), reached])

    const handleScroll = () => {
        if (!contentRef.current) {
            return
        }

        const contentHeight = contentRef.current.offsetHeight
        const scrollHeight = contentRef.current.scrollHeight
        const scrollTop = contentRef.current.scrollTop

        if (scrollHeight <= contentHeight) {
            return
        }

        const afterEndReach = scrollHeight - (scrollTop + contentHeight - 100) < contentHeight / 2

        if (!reached) {
            setReached(afterEndReach)
        }
    }

    const hasntToolbarContent = (subject && subject.type === 'club' && subject.teams.length < 2)

    const matchesToShow = matches ? matches.reduce((o, i) => {
        if (!o.find(v => v._id === i._id)) {
            o.push(i);
        }
        return o;
    }, []).filter(m => toolbar.filters.value ? m.home.name.toUpperCase().includes(toolbar.filters.value.toUpperCase()) || m.away.name.toUpperCase().includes(toolbar.filters.value.toUpperCase()) || (m.location ? m.location.name.toUpperCase().includes(toolbar.filters.value.toUpperCase()) : false) || m.stage.tournament.name.toUpperCase().includes(toolbar.filters.value.toUpperCase()) : m) : null

    return [
        <div className={'toolbar'} key='toolbar' style={hasntToolbarContent ? {margin: 0} : {}}>
            <span className="p-buttonset">
                {subject ? subject.type !== 'club' ? null : subject.teams.length > 1 ? [{label: 'Все команды', value: 'all'}].concat(subject.teams.map(t => ({label: t.name, value: t._id}))).map((btn, idx) => (
                    <Button
                        key={`range_btn_${idx}`}
                        label={btn.label}
                        className={`p-button p-button-sm ${btn.value !== filterTeams ? 'p-button-outlined' : ''} p-button-info`}
                        onClick={() => {
                            setFilterTeams(btn.value)
                        }}
                    />
                )) : null : null}
                {withRefinements && withRefinements.length ? (
                    <Button
                        key={`range_btn_with_refinements`}
                        label='С корректировками'
                        className={`p-button p-button-sm ${'С корректировками' !== toolbar.filters.rangeBtn.label ? 'p-button-outlined' : ''} p-button-info`}
                        onClick={() => setFilter('rangeBtn', {label: 'С корректировками'})}
                    >
                        <Badge severity='danger' value={withRefinements.length} />
                    </Button>
                ) : null}
            </span>
        </div>,
        <div className={'content'+(hasntToolbarContent ? ' no-toolbar' : '')} key='content'>
            <div className={'matches-feed'}>
                {subject ? !filterTeams && toolbar.filters.rangeBtn && toolbar.filters.rangeBtn.range ? <span className={'date'}>{`${moment(toolbar.filters.rangeBtn.range.min, 'YY-MM-DD').format('D MMMM')}${toolbar.filters.rangeBtn.range.max !== toolbar.filters.rangeBtn.range.min ? ' - '+moment(toolbar.filters.rangeBtn.range.max, 'YY-MM-DD').format('D MMMM') : ''}`}</span> : null : null}

                {loading ? <ProgressSpinner className='loading' animationDuration='1s'/> : (
                    <div className='matches-feed__item' ref={contentRef} onScroll={handleScroll} style={contentOffset ? {height: `calc(100vh - ${contentOffset+30}px)`} : {}}>
                        {(withRefinements && withRefinements.length && !toolbar.filters.rangeBtn.range) ? withRefinements.map(match => (
                            <MatchItem
                                key={match._id}
                                data={match}
                                showDate={filterTeams !== null}
                                subject={subject}
                                patchScores={obj => setMatches(matches.map(m => m._id === match._id ? ({...m, scores: {...m.scores, full: obj}}) : m))}
                            />
                        )) : matchesToShow ? !matchesToShow.length && !loading ? (
                            <NonIdealState icon='calendar' text='нет матчей, выберите другой день или период' />
                        ) : matchesToShow.map(match => (
                            <MatchItem
                                key={match._id}
                                data={match}
                                showDate={filterTeams !== null}
                                subject={subject}
                                patchScores={obj => setMatches(matches.map(m => m._id === match._id ? ({...m, scores: {...m.scores, full: obj}}) : m))}
                            />
                        )) : null}
                        {loader ?  <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" className='loader'/> : null}
                </div>)}

            </div>
            <div className={'side-notes'}>
                <div className={'image'}><img src={Tablo} alt={'image'}/></div>
                <div className={'text-group'}>
                    <ul role="list" className={'text-group__text'}>
                        <li>
                            Кликните на карточку матча для более подробной информации и редактирования
                        </li>
                        <li>
                            В ленте матчей собраны игры только на ближайшие даты / за последний месяц. Для действий с архивными или более поздними матчами, используйте раздел <Link to={{pathname: '/schedule'}}>Расписание</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    ]
}

export default Matches
