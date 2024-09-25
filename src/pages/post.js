
import React from "react";

export default function Post(props) {
    const { post } = props;

    return (
        <div>
            { post.title }
        </div>
    );
}