import React, { useState } from 'react'

import { ImageHandler } from '../../Atoms'
import Attachment from '../Attachment'
import {FileUpload} from "primereact/fileupload"

const CustomUploads = ({ onUploaded, customUploader, chooseOptions }) => {
    return  <div className='custom-upload'>
                <div className='upload-section'>
                    <div className='subtitle'>Обложка</div>
                    <div className='notice'>Горизонтальное фото (.jpg, .png)</div>

                    <div className='upload-action'>
                        <ImageHandler
                            label='Загрузить'
                            ratio={16/9}
                            onUploaded={onUploaded}
                        />
                    </div>
                </div>

                <div className='upload-section'>
                    <div className='subtitle'>Документы</div>
                    <div className='notice'>Файл в формате .doc,.docx,.odt,.xls,.xlsx,.ppt,.pptx,.pdf</div>

                    <div className='upload-action'>
                        <FileUpload
                            mode='basic'
                            name="demo[]"
                            url="https://primefaces.org/primereact/showcase/upload.php"
                            multiple={true}
                            accept=".doc,.docx,.odt,.xls,.xlsx,.ppt,.pptx,.pdf"
                            maxFileSize={8e+6}
                            chooseLabel="Прикрепить файлы"
                            chooseOptions={chooseOptions}
                            customUpload
                            onSelect={customUploader}
                        />
                    </div>
                </div>
            </div>
}

export default CustomUploads
