
import React, { Fragment, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import './expression.scss'

// Primitive format:
// .name = type(content)
function PrimitiveExpression(props) {
    const { name, type, content, shouldEmphasizeName = false, shouldEmphasizeContent = false } = props;
    let elements = [];
    let separator = ''

    // strings are considered primitive, with the added '' separator
    if (type == 'string') {
        separator = '\'';
    }

    let contentSplit = content.split(/(\s)/);
    let contentElements = contentSplit.map((element, index) => {
        if (shouldEmphasizeContent) {
            if (index == contentSplit.length - 1) {
                return (
                    <div>
                        <span className='expression-element highlighted' key={index}>{element}</span>
                        <span className='expression-element'>{`${separator})`}</span>
                        <span className='expression-element comment'>{';'}</span>
                    </div>
                );
            }
            else {
                return <span className='expression-element highlighted' key={index}>{element}</span>
            }
        }
        else {
            if (index == contentSplit.length - 1) {
                return (
                    <div>
                        <span className='expression-element' key={index}>{element}</span>
                        <span className='expression-element'>{`${separator})`}</span>
                        <span className='expression-element comment'>{';'}</span>
                    </div>
                );
            }
            else {
                return <span className='expression-element' key={index}>{element}</span>
            }
        }
    });

    if (shouldEmphasizeName) {
        elements.push(
            <span className='expression-element'>{'.'}</span>,
            <span className='expression-element highlighted'>{name}</span>,
            <span className='expression-element'>{` = ${type}(${separator}`}</span>
        );

        elements.push(
            contentElements.map((element, index) => (
                <Fragment key={index}>{element}</Fragment>
            ))
        );
    }
    else if (shouldEmphasizeContent) {
        elements.push(<span className='expression-element'>{`.${name} = ${type}(${separator}`}</span>);

        elements.push(
            contentElements.map((element, index) => (
                <Fragment key={index}>{element}</Fragment>
            ))
        );
    }
    else {
        elements.push(<span className='expression-element'>{`.${name} = ${type}(${separator}`}</span>);

        elements.push(
            contentElements.map((element, index) => (
                <Fragment key={index}>{element}</Fragment>
            ))
        );
    }

    return (
        <div className='expression' data-aos='fade-left' data-aos-duration='400' data-aos-easing='ease-in-out'>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </div>
    );
}

// .name = { ...children }
function ObjectExpression(props) {
    const { name, shouldEmphasizeName = false, children } = props;
    let elements = [];

    if (shouldEmphasizeName) {
        elements.push(
            <span className='expression-element'>{'.'}</span>,
            <span className='expression-element highlighted'>{name}</span>,
            <span className='expression-element'>{` = { `}</span>
        );
    }
    else {
        elements.push(<span className='expression-element'>{`.${name} = { `}</span>);
    }

    elements.push([children]);
    elements.push(<span className='expression-element'>{' }'}</span>);
    elements.push(<span className='expression-element comment'>{';'}</span>);

    return (
        <div className='expression' data-aos='fade-left' data-aos-duration='400' data-aos-easing='ease-in-out'>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </div>
    );
}

function ContainerExpression(props) {
    const { name, type, content = null, shouldEmphasizeName = false, children } = props;
    let header = [];

    // Different container expressions have different separators.
    let startSeparator = '(';
    let endSeparator = ')';
    if (type == 'array') {
        startSeparator = '[';
        endSeparator = ']';
    }

    if (shouldEmphasizeName) {
        header.push(
            <span className='expression-element'>{'.'}</span>,
            <span className='expression-element highlighted'>{name}</span>,
            <span className='expression-element'>{` = ${type}${startSeparator}${content ? content : ''}${endSeparator} {`}</span>
        );
    }
    else {
        header.push(<span className='expression-element'>{`.${name} = ${type}${startSeparator}${content ? content : ''}${endSeparator} {`}</span>);
    }

    let footer = []
    footer.push(
        <span className='expression-element'>{'}'}</span>,
        <span className='expression-element comment'>{`; // end of ${name.replace(/_+/g, ' ')}`}</span>
    );

    return (
        <Fragment>
            <div className='expression' data-aos='fade-left' data-aos-duration='400' data-aos-easing='ease-in-out'>
                {
                    header.map((element, index) => (
                        <Fragment key={index}>{element}</Fragment>
                    ))
                }
            </div>
            {children}
            <div className='expression' data-aos='fade-left' data-aos-duration='400' data-aos-easing='ease-in-out'>
                {
                    footer.map((element, index) => (
                        <Fragment key={index}>{element}</Fragment>
                    ))
                }
            </div>
        </Fragment>
    );
}

// // content
function Comment(props) {
    const { content } = props;
    return (
        <div className='expression comment'>
            <span className='comment'>{content}</span>
        </div>
    );
}

export {
    Comment, PrimitiveExpression, ObjectExpression, ContainerExpression
};