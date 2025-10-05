import React from "react";
import {useParams} from "react-router-dom";

export default function ProductScreen() {
    const params = useParams();
    const {htbc} = params;

    return <div>ProductScreen: {htbc}</div>;
}
