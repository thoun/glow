function slideToObjectAndAttach(object: HTMLElement, destinationId: string, posX?: number, posY?: number): Promise<boolean> {
    const destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        const originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';

        const objectCR = object.getBoundingClientRect();
        const destinationCR = destination.getBoundingClientRect();

        const deltaX = destinationCR.left - objectCR.left + (posX ?? 0);
        const deltaY = destinationCR.top - objectCR.top + (posY ?? 0);

        const attachToNewParent = () => {
            object.style.top = posY !== undefined ? `${posY}px` : 'unset';
            object.style.left = posX !== undefined ? `${posX}px` : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? ''+originalZIndex : 'unset';
            object.style.transform = 'unset';
            object.style.transition = 'unset';
            destination.appendChild(object);
        }

        if (document.visibilityState === 'hidden') {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        } else {
            object.style.transition = `transform 0.5s ease-in`;
            object.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            const transitionend = () => {
                attachToNewParent();

                object.removeEventListener('transitionend', transitionend);

                resolve(true);
            };

            object.addEventListener('transitionend', transitionend);
        }
    });
}