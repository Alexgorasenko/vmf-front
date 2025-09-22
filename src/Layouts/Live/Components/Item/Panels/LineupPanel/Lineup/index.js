import React from 'react'

import './style.scss'

const renderLines = (data, theme, extended, history) => {
    const model = data.formation ? data.formation.split('-') : []
    let pull = [...data.players]

    const rows = model.reduce((acc, qty) => {
        acc.push(pull.slice(0, qty))
        pull = pull.slice(qty)

        return acc
    }, []).reverse()

    return rows.map((row, i) => (
        <div className='lineup-row' key={i}>
            {row.map((p, i) => (
                <div className='lineup-row-item' key={i}>
                    <div
                        className='lineup-row-item_num alterfont'
                        style={theme ? {
                            background: `${theme.numFill}`,
                            color: `${theme.numColor}`,
                            boxShadow: `1px 1px 20px ${theme.numShadow}`
                        } : {}}
                    >{extended ? (
                        <img src={p.avatarUrl} />
                    ) : (p.num || 'БН')}</div>
                    <div
                        className='lineup-row-item_name alterfont'
                        style={theme ? {
                            color: `${theme.nameColor}`
                        } : {}}
                    >{p.surname}</div>
                    {extended && p.teams && p.teams[0] ? (
                        <div
                            className='lineup-row-item_team'
                            style={theme.mutedColor ? {
                                color: `${theme.mutedColor}`
                            } : {}}
                        >{p.teams[0].name}</div>
                    ) : null}
                </div>
            ))}
        </div>
    ))
}

const Lineup = ({ width, data, theme, heatmap, extended }) => {
    return  <div className='lineup'>
                {data && data.players ? renderLines(data, theme, extended) : heatmap ? (<span className='empty'>нет данных</span>) : (<span className='empty'>нет расстановки</span>)}
            </div>
}

export default Lineup
