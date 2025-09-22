import React, { useState, useEffect, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import InputMask from 'react-input-mask'
import axios from 'axios'

import { ENDPOINT } from '../../env'

import './style.scss'

const ENGINE = `${ENDPOINT}v1/`

const Auth = () => {
    const [fetchNum, setFetchNum] = useState(false)
    const [num, setNum] = useState('')
    const [numErr, setNumErr] = useState(null)
    const [checkedPhone, setCheckedPhone] = useState(null)
    const [pin, setPin] = useState('')
    const [pinErr, setPinErr] = useState(null)
    const [fetchAuth, setFetchAuth] = useState(false)
    const [preMode, setPreMode] = useState(false)

    const pinRef = useRef(null)
    const history = useHistory()

    const authorize = () => {
        setFetchAuth(true)
        axios.post(`${ENGINE}userflow/login`, {
            phone: checkedPhone,
            code: pin,
            fillCode: preMode
        }).then(login => {
            setTimeout(() => {
                setFetchAuth(false)
                if(login.data && login.data.token) {
                    localStorage.setItem('_amateum_tkn', login.data.token)
                    setTimeout(() => {
                        window.location.reload()
                    }, 300)
                } else {
                    setPinErr('Ошибка входа. Неверный PIN')
                }
            }, 700)
        })
    }

    useEffect(() => {
        setPinErr(null)
    }, [pin])

    useEffect(() => {
        setNumErr(null)
        if(/^(\+7)\s\d{3}\s\d{3}\s\d{2}\s\d{2}$/.test(num)) {
            setFetchNum(true)
            axios.post(`${ENGINE}userflow/checkPhone`, {
                phone: num
            }).then(checked => {
                setTimeout(() => {
                    setFetchNum(false)
                    if(checked.data && checked.data.userId) { setCheckedPhone(checked.data.formatted) }
                    if(checked.data && !checked.data.userId) {
                        setNumErr('Пользователь с таким номером не найден')
                    } else if(checked.data && checked.data.userId) {
                        pinRef.current.focus()
                        setNumErr(null)
                        if(checked.data.prepared) {
                            setPreMode(true)
                        }
                    }
                }, 700)
            })
        } else {
            setFetchNum(false)
        }
    }, [num])

    return  <div className='auth'>
                <div className='content'>
                    <div className='body'>
                        <img className='brand' src={require('./brand.png')} />
                        <div className='title'>Вход в систему</div>
                        <div className='form'>
                            <InputMask mask='+7 999 999 99 99' disabled={fetchNum} onChange={e => setNum(e.target.value)}>
                                {() => (
                                    <span className="p-input-icon-right">
                                        {fetchNum ? <i className="pi pi-spin pi-spinner" /> : null}
                                        <InputText
                                            placeholder='Номер телефона'
                                            id="phone"
                                            aria-describedby="phone-help"
                                            className={numErr ? 'p-invalid' : ''}
                                            disabled={fetchNum}
                                            inputmode='numeric'
                                        />
                                    </span>
                                )}
                            </InputMask>
                            {numErr ? <small id="phone-help" className="p-error block">{numErr}</small> : null}

                            <InputMask mask='9999' disabled={!checkedPhone} onChange={e => setPin(e.target.value)}>
                                {() => (
                                    <span className={"p-input-icon-right"+(!checkedPhone ? ' collapsed-input' : '')} style={{marginTop: 20}}>
                                        <InputText
                                            placeholder={preMode ? 'Придумайте простой PIN' : 'PIN-код'}
                                            id="pin"
                                            aria-describedby="pin-help"
                                            className={pinErr ? 'p-invalid' : ''}
                                            disabled={!checkedPhone}
                                            ref={pinRef}
                                            inputmode='numeric'
                                        />
                                    </span>
                                )}
                            </InputMask>
                            {pinErr ? <small id="pin-help" className="p-error block">{pinErr}</small> : null}
                        </div>
                        <Button
                            className='p-button-primary p-button-sm'
                            label='Войти'
                            disabled={!/^\d{4}/.test(pin)}
                            onClick={() => authorize()}
                            iconPos='right'
                            loading={fetchAuth}
                        />
                    </div>
                </div>
                <div className='secondary'>
                </div>
            </div>
}

export default Auth
