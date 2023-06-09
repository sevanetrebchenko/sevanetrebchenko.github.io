import React, { Fragment, useRef, useState, useEffect } from 'react';
import { PrimitiveExpression } from '../components/expression';
import './page.scss'

export default function Page(props) {
    const { title, description, coverImageUrl, children } = props;
    const style = {
        backgroundImage: `url(\'${coverImageUrl}\')`
    }
    
    return (
        <Fragment>
            <section className='page-header' style={style}>
                <div className='page-header-content'>
                    <div className='page-title'>
                        <span>{'class'}</span>
                        <span className='page-name'>{title}</span>
                        <span>{'{    '}</span>
                    </div>
                    <PrimitiveExpression
                        name={'description'}
                        type={'string'}
                        content={description}
                        shouldEmphasizeContent={true}>
                    </PrimitiveExpression>
                </div>
                <div className='page-header-overlay'></div>
            </section>
            <section className='page-content'>
                {children}
            </section>
            <div className='page-footer-content'>
                <span>{'}    '}</span>
                <span className='page-name' style={{opacity: '0'}}>{title}</span>
                <span>{'     '}</span>
            </div>
        </Fragment>
    );
}