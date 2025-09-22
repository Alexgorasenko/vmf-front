import React, { useState, useRef, useEffect } from 'react'

import { FileUpload } from 'primereact/fileupload'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'

import 'react-image-crop/src/ReactCrop.scss'
import './style.scss'

import axios from 'axios'
import { ENDPOINT } from '../../../env'

const ImageCropper = ({ image, setCurrent }) => {
    const [crop, setCrop] = useState()
    const [origins, setOrigins] = useState(null)

    useEffect(() => {
        setCurrent({crop, origins})
    }, [crop, origins])

    const onImageLoad = e => {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget

        setOrigins([width, height])

        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                16 / 9,
                width,
                height
            ),
            width,
            height
        )

        setCrop(crop)
    }

    return  <ReactCrop
                crop={crop}
                onChange={(c, pc) => setCrop(pc)}
                aspect={16 / 9}
            >
                <img src={image} onLoad={onImageLoad} />
            </ReactCrop>
}

const ImageHandler = ({ label, ratio, onUploaded }) => {
    const [image, setImage] = useState(null)
    const [current, setCurrent] = useState(null)
    const [loading, setLoading] = useState(false)

    const fileRef = useState()

    const handleUpload = async e => {
        const file = e.files[0]
        const reader = new FileReader();
        let blob = await fetch(file.objectURL).then(r => r.blob()); //blob:url
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            setImage(base64data)
        }
    }

    const makeCrop = () => {
        setLoading(true)
        const { crop, origins } = current
        const elem = document.createElement('canvas')
        document.getElementById('root').appendChild(elem)
        elem.width = origins[0]*(crop.width/100)
        elem.height = origins[1]*(crop.height/100)
        const ctx = elem.getContext('2d')
        const img = new Image()
        img.onload = () => {
            console.log(origins[0]*(crop.x/100), origins[1]*(crop.y/100))
            ctx.drawImage(
                img,
                origins[0]*(crop.x/100),
                origins[1]*(crop.y/100),
                elem.width,
                elem.height,
                0,
                0,
                elem.width,
                elem.height
            )

            const decoded = elem.toDataURL('image/jpeg')
            axios.post(`${ENDPOINT}v1/common/upload`, {
                target: 'attachments',
                base64Data: decoded,
                asRaw: true
            }).then(resp => {
                setLoading(false)
                if(fileRef && fileRef.current) {
                    fileRef.current.clear()
                }
                setImage(null)
                setCurrent(null)
                onUploaded({
                    width: elem.width,
                    height: elem.height,
                    url: resp.data.uploaded
                })
            })
        }

        img.src = image
    }

    return  [
                <FileUpload
                    ref={fileRef}
                    auto
                    mode='basic'
                    name="demo[]"
                    multiple={false}
                    accept="image/*"
                    maxFileSize={8e+6}
                    chooseLabel={label}
                    chooseOptions={() => null}
                    customUpload
                    onSelect={handleUpload}
                />,
                <Dialog
                    visible={image !== null}
                    resizable={false}
                    maskClassName='crop-dialog'
                    onHide={() => {
                        setImage(null)
                        fileRef.current.clear()
                    }}
                    footer={(
                        <div className='actions'>
                            <Button className='p-button-sm btn-create' icon='pi pi-check' loading={loading} label='Готово' onClick={() => makeCrop()} />
                            <Button className='p-button-sm btn-delete' label='Закрыть' icon='pi pi-times' onClick={() => {
                                fileRef.current.clear()
                                setLoading(false)
                                setCurrent(null)
                                setImage(null)
                            }} />
                        </div>
                    )}
                >
                    <div className='crop-preview'>
                        <ImageCropper image={image} setCurrent={setCurrent} />
                    </div>
                </Dialog>
            ]
}

export default ImageHandler
