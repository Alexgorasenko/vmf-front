import React from 'react'

import { Skeleton } from 'primereact/skeleton'

import './style.scss'

const ListLoader = () => {
    return  <div className='list-loader'>
                <div className='top'>
                    <Skeleton width={90} height={34} />
                    <Skeleton width={120} height={34} />
                    <Skeleton width={100} height={34} />
                </div>

                <div className='loader-list'>
                    <Skeleton height={110} />
                    <Skeleton height={110} />
                    <Skeleton height={110} />
                    <Skeleton height={110} />
                    <Skeleton height={110} />
                </div>
            </div>
}

export default ListLoader
