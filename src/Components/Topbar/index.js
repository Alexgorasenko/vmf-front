import React, { useState, useEffect, useContext, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import { WorkspaceContext } from '../../ctx'
import { Skeleton } from 'primereact/skeleton'
import { Avatar } from 'primereact/avatar'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Checkbox } from 'primereact/checkbox'
import './style.scss'
import moment from 'moment';
import axios from 'axios';
import { ENDPOINT } from '../../env'
const yesterday = moment().add(-1, 'days').format('YY-MM-DD');
const today = moment().format('YY-MM-DD');
const tomorrow = moment().add(1, 'days').format('YY-MM-DD');
const twomorrow = moment().add(2, 'days').format('YY-MM-DD');

const keys = {
    [yesterday]: 'вчера',
    [today]: 'сегодня',
    [tomorrow]: 'завтра',
    [twomorrow]: 'послезавтра'
}

const Topbar = ({ title, layout, toggleShownMenu, profile, hasBackBtn }) => {
    const ctx = useContext(WorkspaceContext)

    const [checkedTourns, setCheckedTourns] = useState([]);
    const [topDropdown, setTopDropdown] = useState(null);
    const [daysSheets, setDaysSheets] = useState([])
    const [progress, setProgress] = useState(false)

    const history = useHistory()

    useEffect(() => {
        if (ctx.workspace.sheets && ctx.workspace.sheets.length) {
            setCheckedTourns(ctx.workspace.sheets.map(t => ({...t, checked: true})));
        } else {
            setCheckedTourns([])
        }
        if (ctx.workspace.topDropdown) {
            setTopDropdown(ctx.workspace.topDropdown);
        }

    }, [ctx.workspace])

    useEffect(() => {
        if (checkedTourns && checkedTourns.length) {
            const d = {};
            for (let t of checkedTourns) {
                const { days, checked } = t;
                if (checked) {
                    for (let key in days) {
                        d[key] = key
                    }
                }
            }
            setDaysSheets(Object.keys(d).sort())
        }
    }, [checkedTourns])

    const op = useRef()

    const getSheets = async d => {
        const filtred = checkedTourns.filter(t => t && t._id && t.checked)
        if (filtred && filtred.length) {
            setProgress(true);

            const tkn = localStorage.getItem('_amateum_subject_tkn')
            for (let t of filtred) {
                const body = {
                    federationId: null,
                    tournamentId: t._id,
                    minDate: d,
                    maxDate: d
                };

                try {
                    const response = await axios.post(
                        `${ENDPOINT}v2/getZipPdfProtocols`,
                        body,
                        {responseType: 'arraybuffer',
                        headers: {
                            'Accept': 'application/octet-stream',
                            'Authorization': tkn
                        }}
                    )
                    if(!response.error && response.succes !== false ) {
                        const blob = new Blob([response.data], {type: 'application/octet-stream'})
                        const link = document.createElement('a')
                        link.href = window.URL.createObjectURL(blob)
                        link.download = `${t.name}.zip`
                        link.click()
                    }
                } catch (e) {
                    console.log('get protocols failed', e);
                }
            }
        }

        setProgress(false)

    }
    const isViewSheets = !!(((ctx.workspace.subject && ctx.workspace.subject.type === 'federation') || (ctx.workspace.appSubject && ctx.workspace.appSubject.type === 'federation')) && window.location.pathname === '/');

    return  !ctx.appSubject || ctx.appSubject.onlyLiveMode || (layout === 'mobile' && window.location.pathname.includes('/live')) ? null : layout !== 'mobile' ? (
            <div className={'topbar '+layout}>
                <div className='container-header'>
                    <div>
                        <div className='collapse-toggle' onClick={() => toggleShownMenu() || null}>
                            <i className='pi pi-bars'></i>
                        </div>
                        <div className='title'>{title}</div>

                        {(window.location.pathname === '/tournaments' || window.location.pathname === '/schedule') && topDropdown ? (
                            <div className='dd-wrap'>
                                <div className='title'>{topDropdown.title}</div>
                                <Dropdown
                                    options={topDropdown.options}
                                    optionLabel='internalName'
                                    value={topDropdown.value}
                                    onChange={e => {
                                        //console.log('topDropdown onchange', ctx.workspace);
                                        ctx.setWorkspace({...ctx.workspace, topDropdown: {...topDropdown, value: e.value}})
                                    }}
                                />
                            </div>
                        ) : null}

                        {isViewSheets && checkedTourns.length ? [
                            <Button
                                className='p-button-sm download-sheets'
                                label='Скачать бланки'
                                icon='pi pi-cloud-download'
                                disabled={progress}
                                onClick={e => op.current.toggle(e)}
                            />,
                            <OverlayPanel ref={op} dismissable>
                                <div className='select-sheets'>
                                    <div className='boxes'>
                                        {checkedTourns.map(t => (
                                            <div className='check' key={t._id}>
                                                <Checkbox
                                                    inputId={t._id}
                                                    checked={t.checked}
                                                    disabled={progress}
                                                    onChange={() => {
                                                        if (progress) {
                                                            return null
                                                        } else {
                                                            const indx = checkedTourns.findIndex(tt => tt._id.toString() === t._id.toString())
                                                            setCheckedTourns(checkedTourns.map((tt, ind) => ind === indx ? {...tt, checked: !t.checked} : tt))
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={t._id}>{t.name}</label>
                                            </div>
                                        ))}
                                    </div>

                                    <span className='p-buttonset'>
                                        {daysSheets.map(d => (
                                            <Button key={d} className='p-button-sm' label={keys[d]} onClick={() => getSheets(d)}/>
                                        ))}
                                    </span>
                                </div>
                            </OverlayPanel>
                        ] : null}
                    </div>
                    <div className='user-area'>
                        {profile ? <Button icon='pi pi-wallet' label={`${profile.balance} ₽`} /> : null}
                        <div className='profile'>
                            {profile ? (
                                <Avatar
                                    label='ДП'
                                    size='normal'
                                    shape='circle'
                                    style={{backgroundColor: '#2196F3', color: '#ffffff', width: '2.62rem', height: '2.62rem'}}
                                />
                            ) : (
                                <Skeleton shape='circle' size='2.62rem' />
                            )}
                            <div className='user'>
                                {profile ? [
                                    <div key='name'>{profile.name}</div>,
                                    <span key='role'>администратор</span>
                                ] : (
                                    <Skeleton />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className='mobile-topbar'>
                <Button
                    className='p-button p-button-text p-button-rounded'
                    icon='pi pi-bars'
                    onClick={() => toggleShownMenu()}
                />

                {topDropdown ? (
                    <div className='dd-wrap'>
                        <div className='title'>{topDropdown.title}</div>
                        <Dropdown
                            options={topDropdown.options}
                            optionLabel='internalName'
                            value={topDropdown.value}
                            onChange={e => ctx.setWorkspace({...ctx.workspace, topDropdown: {...ctx.workspace.topDropdown, value: e.value}})}
                        />
                    </div>
                ) : null}

                {!hasBackBtn ? (
                    <Button
                        className='p-button p-button-text p-button-rounded'
                        icon='pi pi-cog'
                        onClick={() => toggleShownMenu()}
                />) : window.location.pathname !== '/' ? (
                    <Button className='p-button-sm btn-create' label='В меню' icon='pi pi-chevron-left' onClick={() => history.push('/')} />
                ) : null}
            </div>
        )
}

export default Topbar
