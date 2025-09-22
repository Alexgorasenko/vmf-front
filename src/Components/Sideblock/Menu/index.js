import React from 'react'
import { useHistory } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton'

import './style.scss'

const Item = ({ data, isActive, menuIdx, setActive, idx, collapsed, loading }) => {
    const history = useHistory()

    return  !loading ? (
                <div
                    className={'ripple menu-item'+(isActive ? ' active' : '')}
                    onClick={() => {
                        if(data.command) {
                            data.command()
                        } else {
                            setActive([menuIdx, idx])
                            if(data.path) { history.push(data.path) }
                        }
                    }}
                >
                    <i className={`pi pi-${data.icon}`}></i>
                    <span>{data.label}</span>
                </div>
            ) : (
                <div className='menu-item'>
                    <Skeleton />
                </div>
            )
}

const Menu = ({ data, isLast, active, setActive, menuIdx, collapsed, loading }) => {
    return  <div className={'menu'+(isLast ? ' last' : '')}>
                <div className='divider'></div>
                {data.map((i, idx) => (
                    <Item
                        key={idx}
                        idx={idx}
                        loading={loading}
                        data={i}
                        isActive={menuIdx === active[0] && idx === active[1]}
                        menuIdx={menuIdx}
                        setActive={setActive}
                        collapsed={collapsed}
                    />
                ))}
            </div>
}

export default Menu
