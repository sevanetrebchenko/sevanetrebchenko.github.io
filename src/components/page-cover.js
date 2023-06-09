import React from 'react';
import { StringExpression, SingleLineExpression, PrimitiveExpression } from './expression';
import './page-cover.scss';

export default function PageCover(props) {
    const { title, description, coverImageUrl } = props;
    const style = {
        backgroundImage: `url(\'${coverImageUrl}\')`
    }

    return (
        <div className='page-cover' style={style} >
            <div className='page-cover-content'>
                <div className='page-cover-title-container'>
                    <code className='first'>{'class'}</code>
                    <span className='page-cover-title'>{title}</span>
                    <code className='second'>{'{'}</code>
                </div>
                <PrimitiveExpression
                    name={'description'}
                    type={'string'}
                    content={description}
                    shouldEmphasizeContent={true}>
                </PrimitiveExpression>
            </div>
            <div className='page-cover-overlay'>
            </div>
        </div>
    );
}