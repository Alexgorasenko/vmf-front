import React, { useState } from 'react'

import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'

import './style.scss'

import moment from 'moment'

const parseDisqualification = (arr, tournamentId, matchDate) => {
    if(!arr || !arr.length || !arr.find(disq => disq.tournamentId === tournamentId)) {
        return null
    } else {
        const disq = arr.find(disq => disq.tournamentId === tournamentId)
        const dd = moment(disq.startDate, 'YY-MM-DD').format('YYYY-MM-DD')
        const ed = disq.finishDate ? moment(disq.finishDate, 'YY-MM-DD').format('YYYY-MM-DD') : null
        const md = moment(disq.startDate, 'YY-MM-DD').format('YYYY-MM-DD')
        const missed = disq.missedMatches ? disq.missedMatches.length : 0;

        if(moment(md).isSameOrAfter(dd, 'day') && !disq.finished) {
            if(disq.count && disq.count > missed) {
                return `дисквал. (${disq.count - missed} матчей)`
            } else if(ed && moment(md).isSameOrBefore(ed, 'day')) {
                return `дисквал. (до ${moment(disq.finishDate, 'YY-MM-DD').format('DD.MM.YY')})`
            } else {
                return null
            }
        } else {
            return null
        }
    }
}

const PlayerItem = ({ data, onToggle, inRoster, patchNum, badge, tournamentId, matchDate, isDouble }) => {
    const [num, setNum] = useState(null)
    const { name, surname, squadState, _id } = data
    const number = squadState ? squadState.number || null : data.num ? data.num : null

    const handleNumClick = e => {
        if(typeof(patchNum) !== 'undefined') {
            setNum((!inRoster || inRoster === 'БН') && (!number || number === 'БН') ? '' : inRoster || number)
        } else {
            return
        }
    }

    const disqualification = parseDisqualification(data.disqualifications, tournamentId, matchDate)

    return  <div className={`player-control${(inRoster || badge) ? ` in-roster${isDouble ? ' is-double' : ''}`: ''}`} style={disqualification ? {opacity: .4} : {}}>
                {typeof(badge) !== 'undefined' && badge !== null ? (
                    <Badge value={badge} severity='info' />
                ) : null}

                {disqualification ? (
                    <Badge value={disqualification} severity='danger' className='disq'/>
                ) : null}

                {num !== null ? (
                    <form onSubmit={e => {
                        e.preventDefault()
                        patchNum({_id, num: num});
                        if(!inRoster) {
                            onToggle({name, surname, _id, num: num})
                        }
                        setTimeout(() => {
                            setNum(null);
                        }, 300)

                    }}>
                        <span className='p-inputnumber p-component p-inputwrapper'>
                            <input
                                autoFocus
                                inputmode='numeric'
                                type='number'
                                className='p-inputtext'
                                value={num}
                                onChange={e => setNum(e.target.value || '')}
                                onBlur={e => {
                                    patchNum({_id, num: e.target.value});
                                    setTimeout(() => {
                                        setNum(null);
                                    }, 300)
                                }}
                                min={1}
                                max={99}
                            />
                        </span>
                    </form>
                ) : (
                    <div className='num' onClick={e => handleNumClick(e)}>{inRoster || number || 'БН'}</div>
                )}
                <div className='info' onClick={() => typeof(onToggle) !== 'undefined' && !disqualification ? onToggle({name, surname, num: num || number, _id}) : null}>
                    <div className='primary'>{data.surname}</div>
                    <div className='secondary'>{data.name}</div>
                </div>
            </div>
}

export default PlayerItem
