
import React, { Fragment } from 'react';
import './expression.scss'

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
        <div className='expression' data-aos='fade-left' data-aos-duration='400' data-aos-easing='ease-in-out'>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </div>
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
        <div className='expression'>
            {
                elements.map((element, index) => (
                    <Fragment key={index}>{element}</Fragment>
                ))
            }
        </div>
    );
}

// .variable_name = array[count] {
//    { children... }
// }; // end of variable name
function ArrayExpression(props) {
    const { name, content, shouldEmphasizeName = false, shouldEmphasizeContent = false, children } = props;

    // Build header expression string: .variable_name = array[count] {
    let header = [];
    if (shouldEmphasizeName) {
        header.push(<span>{'.'}</span>);
        header.push(<span className='highlighted'>{name}</span>);

        if (shouldEmphasizeContent) {
            header.push(<span>{` = array[`}</span>);
            header.push(<span className='highlighted'>{content}</span>);
            header.push(<span>{`] {`}</span>);
        }
        else {
            header.push(<span>{` = array[${content}] {`}</span>);
        }
    }
    else if (shouldEmphasizeContent) {
        header.push(<span>{`.${name} = array[`}</span>);
        header.push(<span className='highlighted'>{content}</span>);
        header.push(<span>{`]`}</span>);
    }
    else {
        header.push(<span>{`.${name} = array[${content}]`}</span>);
    }

    // Build footer expression string: }; // end of variable name
    let footer = [];
    footer.push(<span>{'}'}</span>);
    footer.push(<span className='comment'>{`; // end of ${name.replace(/_+/g, ' ')}`}</span>);

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
        <div className='expression'>
            <span className='comment'>{content}</span>
        </div>
    );
}

export {
    StringExpression, ArrayExpression, Comment
};