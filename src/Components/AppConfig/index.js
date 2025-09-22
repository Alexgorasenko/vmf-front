import React, { useState, useEffect, useRef } from 'react'

import './style.scss'

import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel'

import axios from 'axios'
import { ENDPOINT } from '../../env'

const colors = ['surface', 'gray', 'bluegray', 'blue', 'green', 'teal', 'indigo', 'cyan', 'yellow', 'orange', 'red', 'pink', 'purple']
const indexes = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

const ThemeItem = ({ data, appId }) => {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState(data[1])

    const saveValue = () => {
        setLoading(true)
        const tkn = localStorage.getItem('_amateum_subject_tkn')
        axios.put(`${ENDPOINT}v2/apps/${appId}`, {[`config.theme.${data[0]}`]: value}, {
            headers: {
                Authorization: tkn
            }
        }).then(resp => {
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        })
    }

    const panelRef = useRef()

    return  <p className="p-inputgroup">
                <span className="p-inputgroup-addon">{data[0]}</span>
                <InputText value={value} onChange={e => setValue(e.target.value)} />
                <span className='p-inputgroup-addon preview' onClick={e => panelRef.current.toggle(e)} style={{background: value}}></span>
                <Button loading={loading} onClick={() => saveValue()} icon='pi pi-check' className='' />

                <OverlayPanel ref={panelRef}>
                    <div className='colors-matrix'>
                        <div className='row head'>
                            <div className='color'>
                            </div>
                            {indexes.map((i, idx) => (
                                <div className='idx' key={idx}>{i}</div>
                            ))}
                        </div>
                        {colors.map((c, idx) => (
                            <div className='row' key={idx}>
                                <div className='color'>{c}</div>
                                {indexes.map((i, _idx) => (
                                    <div
                                        onClick={(e) => {
                                            setValue(`var(--${c}-${i})`);
                                            panelRef.current.toggle(e);
                                        }}
                                        className='idx'
                                        key={_idx}
                                        style={{background: `var(--${c}-${i})`}}
                                    ></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </OverlayPanel>
            </p>
}

const AppConfig = ({ subject }) => {
    const [data, setData] = useState(null)
    const [appId, setAppId] = useState(null)
    const [err, setErr] = useState(null)

    useEffect(() => {
        setData(null)
        setErr(null)
        setAppId(null)

        if(subject && subject._id) {
            const tkn = localStorage.getItem('_amateum_subject_tkn')
            axios.get(`${ENDPOINT}v2/currentTheme`, {
                headers: {
                    Authorization: tkn
                }
            }).then(resp => {
                if(resp.data) {
                    if(!resp.data.error) {
                        setData(resp.data.theme)
                        setAppId(resp.data.appId)
                    } else {
                        setErr(resp.data.message)
                    }
                }
            })
        }
    }, [subject])

    return  <div className='theme-conf'>
                {data ? Object.entries(data).map((e, i) => (
                    <ThemeItem key={i} data={e} appId={appId} />
                )) : err || null}
            </div>
}

export default AppConfig
