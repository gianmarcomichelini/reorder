import React from 'react';
import {Button, Modal} from 'react-bootstrap';

const MessageModal = ({ show, onClose, title , message, variant, onAfterClose}) => {
    const renderMultilineMessage = (msg) => {
        return (msg || '').split('\n').map((line, index) => (
            <p key={index}>{line}</p>
        ));
    };

    const renderMessage = () => {
        return renderMultilineMessage(message);
    };

    const handleClose = () => {
        //console.log(onAfterClose);
        onClose();
        if (onAfterClose) onAfterClose(); // optional callback after close
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className={`text-${variant}`}>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{renderMessage()}</Modal.Body>
            <Modal.Footer>
                <Button variant={variant} onClick={handleClose}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
    );
};


export default MessageModal;