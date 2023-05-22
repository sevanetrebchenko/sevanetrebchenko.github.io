
import React, { Fragment, useRef, useEffect } from 'react';
import { addClassName, removeClassName } from '../util/util';
import useStateRef from '../util/use-state-ref';

import './expression.less'

// Base 'Expression' functionality.
function Expression(props) {
    const { children } = props;
    const expressionRef = useRef(null);
    const [expressionBoundingRectRef, setExpressionBoundingRect] = useStateRef(null);

    useEffect(() => {
        const handleScroll = function () {
            const expression = expressionRef.current;
            if (!expression) {
                return;
            }

            let expressionBoundingRect = expressionBoundingRectRef.current;
            if (!expressionBoundingRectRef.current) {
                expressionBoundingRect = expression.getBoundingClientRect();
                setExpressionBoundingRect(expressionBoundingRect);
            }

            if (window.scrollY + window.innerHeight > expressionBoundingRect.y + (expressionBoundingRect.height * 1.2)) {
                addClassName(expression, 'active');
            }
            else {
                removeClassName(expression, 'active');
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll, { passive: true });
        }
    }, []);

    return (
        <div className='expression-container'>
            <div className='expression' ref={expressionRef}>
                {children}
            </div>
        </div>
    );
}

// .variable_name = string('content');
function StringExpression(props) {
    const { name, content, shouldEmphasizeName = false, shouldEmphasizeContent = false } = props;
    let elements = [];

    // Build header expression string: .variable_name = array[count] {
    if (shouldEmphasizeName) {
        elements.push(<span>{'.'}</span>);
        elements.push(<span className='highlighted'>{name}</span>);

        if (shouldEmphasizeContent) {
            elements.push(<span>{` = string(\'`}</span>);
            elements.push(<span className='highlighted'>{content}</span>);
            elements.push(<span>{`\');`}</span>);
        }
        else {
            elements.push(<span>{` = string(\'${content}\');`}</span>);
        }
    }
    else if (shouldEmphasizeContent) {
        elements.push(<span>{`.${name} = string(\'`}</span>);
        elements.push(<span className='highlighted'>{content}</span>);
        elements.push(<span>{`\');`}</span>);
    }
    else {
        elements.push(<span>{`.${name} = string(\'${content}\');`}</span>);
    }

    return (
        <Expression>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </Expression>
    );
}

// TODO: format name based on external style guide / configuration file.
function ArrayExpressionHeader(props) {
    const { name, content, shouldEmphasizeName = false, shouldEmphasizeContent = false } = props;
    let elements = [];

    // Build header expression string: .variable_name = array[count] {
    if (shouldEmphasizeName) {
        elements.push(<span>{'.'}</span>);
        elements.push(<span className='highlighted'>{name}</span>);

        if (shouldEmphasizeContent) {
            elements.push(<span>{` = array[`}</span>);
            elements.push(<span className='highlighted'>{content}</span>);
            elements.push(<span>{`] {`}</span>);
        }
        else {
            elements.push(<span>{` = array[${content}] {`}</span>);
        }
    }
    else if (shouldEmphasizeContent) {
        elements.push(<span>{`.${name} = array[`}</span>);
        elements.push(<span className='highlighted'>{content}</span>);
        elements.push(<span>{`]`}</span>);
    }
    else {
        elements.push(<span>{`.${name} = array[${content}]`}</span>);
    }

    return (
        <Expression>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </Expression>
    );
}

function ArrayExpressionFooter(props) {
    const { name } = props;

    // Build footer expression string: }; // end of variable name
    return (
        <Expression>
            <span>{'}'}</span>,
            <span className='comment'>{`; // end of ${name.replace(/_+/g, ' ')}`}</span>
        </Expression>
    );
}

// .variable_name = array[count] {
//    ...
// }; // end of variable name
function ArrayExpression(props) {
    const { children } = props;

    return (
        <Fragment>
            <ArrayExpressionHeader {...props}></ArrayExpressionHeader>
            {children}
            <ArrayExpressionFooter {...props}></ArrayExpressionFooter>
        </Fragment>
    );
}

// // content
function Comment(props) {
    const { content } = props;
    return (
        <Expression>
            <span className='comment'>{content}</span>
        </Expression>
    );
}

export {
    StringExpression, ArrayExpression, Comment
};