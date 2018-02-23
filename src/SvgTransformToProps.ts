// https://codepen.io/gapcode/pen/vEJNZN
function detectIE() {
    let ua = window.navigator.userAgent;

    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        let rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    let edge = ua.indexOf('Edge/');
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}

let isEdge = detectIE() !== false;

interface InProps {
    translate?: [number, number];
    rotate?: number;
}

interface OutProps {
    style?: { transform: string };
    transform?: string;
}

let transformProps = function(props: InProps) {
    let formatted = [];
    if (props.translate !== undefined) {
        formatted.push(isEdge ? `translate(${props.translate![0]} ${props.translate![1]})` : `translate(${props.translate![0]}px,${props.translate![1]}px)`);
    }

    if (props.rotate !== undefined) {
        formatted.push(isEdge ? `rotate(${props.rotate})` : `rotate(${props.rotate}deg)`);
    }

    return formatted.join(' ');
};

/**
 * Get props to transform svgs in a way that works in both edge and other browsers.
 * @param props the transform props you want to apply. The order is always translate, rotate
 */
export function transform(props: InProps): OutProps {
    if (isEdge === false) {
        return {
            style: {
                transform: transformProps(props)
            }
        };
    } else {
        return {
            transform: transformProps(props)
        };
    }
}
