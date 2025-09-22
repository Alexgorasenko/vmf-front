import React, { useState, useEffect, useContext } from 'react'

import { WorkspaceContext } from '../../ctx'
import { contents } from './contents'

import ReactPlayer from 'react-player/lazy'

import { Button } from 'primereact/button'

import './style.scss'

const TipContent = ({ tip }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const content = tip ? contents[tip[0]][tip[1]] : null

    const ctx = useContext(WorkspaceContext)

    return  content ? (
                <div className='tip-content'>
                    <div className='tip-content_media'>
                        <ReactPlayer
                            url={content.media}
                            playing={isPlaying}
                            controls
                        />
                    </div>

                    <div className='tip-content_body'>
                        {content.title ? <div className='title'>{content.title}</div> : null}
                        <div className='text'>{content.body}</div>
                    </div>

                    <div className='tip-content_actions'>
                        <Button
                            className='p-button p-button-sm p-button-info'
                            onClick={() => setIsPlaying(true)}
                        >Смотреть</Button>
                        <Button
                            className='p-button p-button-sm p-button-secondary'
                            onClick={() => ctx.setWorkspace({...ctx.workspace, tip: null})}
                        >Разберусь сам</Button>
                    </div>
                </div>
            ) : null
}

export default TipContent
