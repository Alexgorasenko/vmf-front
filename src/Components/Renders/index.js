import React, { useState, useEffect } from 'react'

import { ProgressSpinner } from 'primereact/progressspinner'
import { Button } from 'primereact/button'

import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../env'

const Download = ({ label, url, suffix }) => {
    const [renderingGraphics, setRenderingGraphics] = useState(false)

    const action = () => {
        setRenderingGraphics(true)
        axios.get(`${ENDPOINT}share?url=${encodeURIComponent(url)}&asDecoded=true`)
            .then(resp => {
                setRenderingGraphics(false)
                const a = document.createElement("a")
                a.href = "data:image/png;base64," + resp.data
                a.download = `${label}_${suffix}.png`
                a.click()
            })
    }

    return url ? <Button
                className='p-button-sm btn-create'
                icon='pi pi-image'
                onClick={() => action()}
                loading={renderingGraphics}
                label={label}
            /> : null

}

const Stages = ({ data }) => {
    const [selected, setSelected] = useState(data.length - 1)
    const [matchesOpened, setMatchesOpened] = useState(null)

    useEffect(() => {
        setMatchesOpened(null)
    }, selected)

    return  <div className='stages'>
                <div className='nav'>
                    {data.map((st, i) => (
                        <div
                            className={`stage${i === selected ? ' selected' : ''}`}
                            key={i}
                            onClick={() => setSelected(i)}
                        >{st.name}</div>
                    ))}
                </div>
                {data[selected] ? <div className='btns'>
                    <Download label='Таблица' url={data[selected].standingsUrl} suffix={data[selected].name} />
                    <Download label='Результаты' url={data[selected].resultsUrl} suffix={data[selected].name} />
                    <Download label='Расписание' url={data[selected].scheduleUrl} suffix={data[selected].name} />
                    {data[selected].groupsSplittedUrls ? data[selected].groupsSplittedUrls.map((g,i) => (
                        <Download key={i} label={g.name} suffix={g.name} url={g.standingsUrl} />
                    )) : null}
                    {data[selected].playoffgridsSplittedUrls ? data[selected].playoffgridsSplittedUrls.map((g,i) => (
                        <Download key={i} label={g.name} suffix={g.name} url={g.standingsUrl} />
                    )) : null}
                </div> : null}

                <div className='card-section'>
                    <div className='section-title'>По матчам:</div>
                    <div className='nav'>
                        <div
                            className={`stage${matchesOpened === 'recent' ? ' selected' : ''}`}
                            onClick={() => setMatchesOpened('recent')}
                        >Прошедшие</div>
                        <div
                            className={`stage${matchesOpened === 'upcoming' ? ' selected' : ''}`}
                            onClick={() => setMatchesOpened('upcoming')}
                        >Ближайшие</div>
                    </div>

                    {matchesOpened && data[selected] ? data[selected].matches[matchesOpened].map((m, i) => (
                        <div className='card-section' key={i}>
                            <div className='section-title'>{m.date} {m.time} {m.teams}</div>
                            <div className='btns'>
                                <Download label='Матч-репорт' url={m.reportUrl} suffix={m.teams} />
                                <Download label='MVP хозяев' url={m.homeMvpUrl} suffix={`${m.teams}_MVP_home`} />
                                <Download label='MVP гостей' url={m.awayMvpUrl} suffix={`${m.teams}_MVP_away`}/>
                                <Download label='Афиша' url={m.coverUrl} suffix={m.teams} />
                            </div>
                        </div>
                    )) : null}
                </div>
            </div>
}

const Renders = ({ subject }) => {
    const [data, setData] = useState(null)

    useEffect(() => {
        setData(null)
        if(subject && subject._id) {
            axios.get(`${ENDPOINT}client/sharableUrls/${subject._id}`)
                .then(resp => {
                    if(resp.data) {
                        setData(resp.data)
                    }
                })
        }
    }, [subject])

    return  <div className='renders'>
                <div className='content'>
                    {!data ? (
                        <ProgressSpinner style={{width: 64, height: 64}} />
                    ) : data.filter(t => t.stages && t.stages.length).map((t, i) => (
                        <div className='content-card' key={i}>
                            <div className='card-title'>{t.name}</div>
                            <div className='card-section'>
                                <div className='section-title'>Общая графика:</div>
                                <Download url={t.scorersUrl} label='Топ-10: Бомбардиры' suffix={t.name} />
                            </div>
                            <div className='card-section'>
                                <div className='section-title'>По стадиям:</div>
                                <Stages data={t.stages} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
}

export default Renders
