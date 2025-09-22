import React, { useState, useEffect, useRef, useContext } from 'react'
import { WorkspaceContext } from '../../ctx'
import {Tag} from "primereact/tag";

import IconTour from '../../assets/img/icon-tour.svg'
import IconCup from '../../assets/img/icon-cup.svg'
import './style.scss'
import { Toast } from 'primereact/toast'
import {classNames} from "primereact/utils";
import { ProgressSpinner } from 'primereact/progressspinner'

import FedNav from "./FedNav";

import { CustomTabMenu } from '../Atoms'

import axios from 'axios'
import { ENDPOINT } from '../../env'
import qs from "qs";

const components = {
    nav: FedNav
}

const items = [
    {label: 'Навигация на сайте', id: 'nav', icon: 'pi pi-fw pi-cog'},
]

const Appearance = ({ subject, layout }) => {
    //console.log('Appearance subject', subject);
    const [tab, setTab] = useState('nav')
    const [tabIndex, setTabIndex] = useState(0)
    const [subjectData, setSubjectData] = useState(subject)
    const [loading, setLoading] = useState(false)
    const [tabmenuEdge, setTabMenuEdge] = useState(0)

    const toast = useRef(null)
    const tabmenuRef = useRef()

    useEffect(() => {
        if(subject && tabmenuRef && tabmenuRef.current && !tabmenuEdge) {
            const { y, height } = tabmenuRef.current.getBoundingClientRect()
            setTabMenuEdge(y + height + 35)
        }
    }, [subject])

    useEffect(() => {
        if(subject) {
            axios.get(`${ENDPOINT}v2/getFedData`, {
                headers: {
                    authorization: localStorage.getItem('_amateum_subject_tkn')
                }
            }).then(resp => {
                //console.log('setSubjectData', resp.data);
                if (resp.data._id) {
                    setSubjectData(resp.data)
                } else {
                    toast.current.show({ severity: 'error', summary: 'get data failed', detail: 'ошибка получения данных' });
                }
            }).catch(e => {
                console.log('get data failed', e);
                toast.current.show({ severity: 'error', summary: 'get data failed', detail: 'ошибка получения данных' });
            })
        }
    }, [subject])


    const onClickTab = (e) =>{
        setTab(e.value.id)
        setTabIndex(e.index)
    }

    const Specified = components[tab] || null

    return (
        <div className={'appearance'}>
            <Toast ref={toast} position='bottom-right' />
            {loading ? <div className='disqual-load'>
                <ProgressSpinner style={{width: 64, height: 64}} />
            </div> : <div className={'content'}>
                <div className='tabmenu' ref={tabmenuRef}>
                    <CustomTabMenu model={items} activeIndex={tabIndex} onTabChange={(e) => onClickTab(e)}/>
                </div>
                {Specified ? (
                    <Specified
                        subject={subjectData}
                        layout={layout}
                        toast={toast.current}
                        tabmenuEdge={tabmenuEdge}
                    />
                ) : null}
            </div> }
        </div>
    )
}

export default Appearance
