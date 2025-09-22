import React, { useContext, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { LiveContext } from './ctx'

import SubjectLoader from './Components/SubjectLoader'
import ListNav from './Components/ListNav'
import Item from './Components/Item'

import Emblem from '../../Components/Emblem'

import { Toast } from 'primereact/toast'

import { Helmet } from 'react-helmet'

import './style.scss'

import { ENDPOINT } from '../../env'
import axios from 'axios'

import moment from 'moment'

const st = window.localStorage.getItem('_amateum_subject_tkn')

const Live = ({ _subject }) => {
    const [subjectTkn, setSubjectTkn] = useState(st || null)
    const [subject, setSubject] = useState(null)
    const [list, setList] = useState(null)
    const [date, setDate] = useState(null)

    const { id } = useParams()

    const toastRef = useRef(null)

    useEffect(() => {
        console.log('EFF', date)
        if(date && subjectTkn && !id) {
            axios.get(`${ENDPOINT}v2/list/liveMatches?date=${date}&attachStates=true`, {
                headers: {
                    Authorization: subjectTkn
                }
            })
            .then(resp => {
                setList(resp.data)
            })
        }
    }, [date, id])

    useEffect(() => {
        if(subjectTkn) {
            axios.get(`${ENDPOINT}v2/getSubject`, {
                headers: {
                    'Authorization': subjectTkn
                }
            }).then(init => {
                setSubject(init.data)
            })
        }
    }, [subjectTkn])

    useEffect(() => {
        if(_subject && (_subject.token !== subjectTkn)) {
            console.log('Token changed')
            setList(null)
            setSubjectTkn(_subject.token)
        }
    }, [_subject])

    return  <LiveContext.Provider
                value={{
                    token: subjectTkn,
                    liveToast: obj => toastRef.current.show(obj),
                    isClub: subject && subject.subjectType === 'club'
                }}
            >
                <Helmet>
                    <title>Матчцентр</title>
                </Helmet>

                <Toast ref={toastRef} position='bottom-center' style={{width: 300}} />

                {!id ? (
                    <div className='live-view'>
                        {!subject ? (
                            <SubjectLoader />
                        ) : (
                            <div className='subject-emblem'>
                                <Emblem source={subject.emblem} backdroped={true} size='md' />
                            </div>
                        )}

                        <ListNav data={list} date={date} setDate={setDate} />
                    </div>
                ) : (
                    <div className='live-view'>
                        <Item
                            teamsAccess={_subject ? _subject.teams || null : null}
                        />
                    </div>
                )}
            </LiveContext.Provider>
}

export default Live
