export function cssTransitionInOut(nodeRef, timeout, classes) {
    setTimeout(() => {
        nodeRef.current.classList.remove(classes + '_exit-active');
        nodeRef.current.classList.add(classes + '_enter');
        setTimeout(() => {
            nodeRef.current.classList.remove(classes + '_enter');
            nodeRef.current.classList.add(classes + '_enter-active');
            setTimeout(() => {
                nodeRef.current.classList.remove(classes + '_enter-active');
                nodeRef.current.classList.add(classes + '_exit');
                setTimeout(() => {
                    nodeRef.current.classList.remove(classes + '_exit');
                    nodeRef.current.classList.add(classes + '_exit-active');
                }, 60);
            }, timeout);
        }, 60);
    }, 0);
}