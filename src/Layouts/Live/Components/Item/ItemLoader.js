import React from 'react'

import { Skeleton } from 'primereact/skeleton'

const ItemLoader = () => {
    return  <div className='item'>
                <div className='item-top'>
                    <Skeleton width={64} height={64} className='subject-emblem' />
                    <div className='team'>
                        <Skeleton width={44} height={44} />
                        <Skeleton width={120} height={18} />
                    </div>

                    <div className='team'>
                        <Skeleton width={44} height={44} />
                        <Skeleton width={120} height={18} />
                    </div>
                </div>

                <div className='timeline-loader'>
                    <Skeleton height={160} width={2} className='line' />

                    <Skeleton width={20} height={20} shape='circle' />
                    <Skeleton width={20} height={20} shape='circle' />
                    <Skeleton width={20} height={20} shape='circle' />
                </div>

                <div className='btns-loader'>
                    <Skeleton height={50} />
                    <Skeleton height={50} />
                </div>
            </div>
}

export default ItemLoader
