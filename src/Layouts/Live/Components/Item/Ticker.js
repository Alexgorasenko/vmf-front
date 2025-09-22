import React, { useEffect, useContext, useState, useRef } from 'react'

import { ItemContext } from '../../ctx'

import { blinkTime } from './helpers'

const convertTime = input => {
    if(!isNaN(parseInt(input))) {
        const mins = Math.floor(parseInt(input)/60)
        const sec = (input+60)%60
        return `${mins < 10 ? '0' : ''}${mins}:${sec < 10 ? '0' : ''}${sec}`
    } else {
        return '00:00'
    }
}

const Ticker = () => {
    const [value, setValue] = useState(0)

    const ctx = useContext(ItemContext)

    const active = useRef(false)
    const workerRef = useRef(null)

    useEffect(() => {
        active.current = ctx.time.active
        if(!ctx.time.active && ctx.time.period) {
            setValue(ctx.time.displayMinute*60)
            blinkTime(ctx.entity._id, ctx.time)
        }
    }, [ctx.time.active])

    useEffect(() => {
        if(value%10 === 5) {
            blinkTime(ctx.entity._id, {...ctx.time, displayMinute: ctx.time.displayMinute})
        }
    }, [value])

    useEffect(() => {
        if(ctx.time.period) {
            if(!workerRef.current) {
                workerRef.current = new Worker('/workers/ticker.js')
            }

            workerRef.current.onmessage = async msg => {
                if(msg.data && msg.data.action === 'tick') {
                    if(active.current && !ctx.entity.finished && ctx.time.stamps[ctx.time.period-1]) {
                        const delta = Math.floor((new Date().getTime() - ctx.time.stamps[ctx.time.period-1])/1000)
                        setValue(delta + (ctx.entity.match.periodDuration*60*(ctx.time.period - 1)))
                        ctx.setTime({...ctx.time, displayMinute: (Math.ceil(delta/60) + (ctx.entity.match.periodDuration*(ctx.time.period - 1)))})
                    }
                }
            }
        }
    }, [ctx.time.period])

    return  <div className='ticker-node'>{!ctx.entity.finished ? convertTime(value) : null}</div>
}

export default Ticker
