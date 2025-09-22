import React from 'react'

import { Skeleton } from 'primereact/skeleton'

import './style.scss'

const SubjectLoader = () => {
    return  <div className='subject-loader'>
                <Skeleton width={64} height={64} />
            </div>
}

export default SubjectLoader
