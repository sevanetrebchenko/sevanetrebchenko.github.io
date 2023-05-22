import React from 'react';
import { StringExpression } from './expression';
import './page-cover.less';

export default function PageCover(props) {
    const { title, description, coverImageUrl } = props;
    const style = {
        backgroundImage: `url(\'${coverImageUrl}\')`
    }

    return (
        <div className='page-cover' style={style} >
            <div className='page-cover-content'>
                <div className='page-cover-title-container'>
                    <code className='first'>{'struct'}</code>
                    <span className='page-cover-title'>{title}</span>
                    <code className='second'>{'{'}</code>
                </div>
                <StringExpression name={'description'} content={'a showcase of some of my best work'} shouldEmphasizeContent={true}></StringExpression>
            </div>
            <div className='page-cover-overlay'>
            </div>
        </div>
    );
}