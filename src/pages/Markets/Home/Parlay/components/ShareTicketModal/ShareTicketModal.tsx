import { getSuccessToastOptions, getErrorToastOptions } from 'config/toast';
import { LINKS } from 'constants/links';
import { toPng } from 'html-to-image';
import { t } from 'i18next';
import React, { useRef, useState, useCallback } from 'react';
import ReactModal from 'react-modal';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FlexDivColumnCentered } from 'styles/common';
import { ParlaysMarket } from 'types/markets';
import MySimpleTicket from './components/MySimpleTicket';
import MyTicket from './components/MyTicket';
import { TwitterIcon } from '../styled-components';
import DisplayOptions from './components/DisplayOptions';

type ShareTicketModalProps = {
    markets: ParlaysMarket[];
    totalQuote: number;
    paid: number;
    payout: number;
    onClose: () => void;
};

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '0px',
        background: 'transparent',
        border: 'none',
        borderRadius: '20px',
        boxShadow: '0px 0px 59px 11px rgba(100, 217, 254, 0.89)',
        overflow: 'visibile',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        zIndex: '1501', // .MuiTooltip-popper has 1500 and validation message pops up from background
    },
};

const TWITTER_MESSAGE = '<PASTE YOUR IMAGE>';

const ShareTicketModal: React.FC<ShareTicketModalProps> = ({ markets, totalQuote, paid, payout, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [toastId, setToastId] = useState<string | number>(0);
    const [isSimpleView, setIsSimpleView] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    const saveImageAndOpenTwitter = useCallback(
        async (toastIdParam: string | number) => {
            if (!isLoading) {
                if (ref.current === null) {
                    return;
                }

                try {
                    const base64Image = await toPng(ref.current, { cacheBust: true });
                    const b64Blob = (await fetch(base64Image)).blob();
                    const cbi = new ClipboardItem({
                        'image/png': b64Blob,
                    });
                    await navigator.clipboard.write([cbi]);

                    if (ref.current === null) {
                        return;
                    }

                    toast.update(
                        toastIdParam,
                        getSuccessToastOptions(
                            <>
                                {t('market.toast-message.image-created')}
                                <br />
                                {t('market.toast-message.open-twitter')}
                            </>
                        )
                    );

                    setTimeout(() => {
                        window.open(LINKS.TwitterStatus + TWITTER_MESSAGE);
                        onClose();
                    }, 3000);

                    setIsLoading(false);
                } catch (e) {
                    console.log(e);
                    setIsLoading(false);
                    toast.update(toastIdParam, getErrorToastOptions(t('market.toast-message.save-image-error')));
                }
            }
        },
        [isLoading, onClose]
    );

    const onTwitterShareClick = () => {
        if (!isLoading) {
            const id = toast.loading(t('market.toast-message.save-image'));
            setToastId(id);
            setIsLoading(true);

            // If image creation is not postponed with timeout toaster is not displayed immediately, it is rendered in parallel with toPng() execution.
            // Function toPng is causing UI to freez for couple of seconds and there is no notification message during that time, so it confuses user.
            setTimeout(() => {
                saveImageAndOpenTwitter(id);
            }, 100);
        }
    };

    const onModalClose = () => {
        if (isLoading) {
            toast.update(toastId, getErrorToastOptions('Image saving canceled!')); // TODO: translate
        }
        onClose();
    };

    return (
        <>
            <ReactModal
                isOpen
                onRequestClose={onModalClose}
                shouldCloseOnOverlayClick={true}
                style={customStyles}
                contentElement={(props, children) => (
                    <>
                        <div {...props}>{children}</div>
                        <DisplayOptions isSimpleView={isSimpleView} setSimpleView={setIsSimpleView} />
                    </>
                )}
            >
                <Container ref={ref}>
                    <CloseIcon className={`icon icon--close`} onClick={onClose} />
                    {isSimpleView ? (
                        <MySimpleTicket payout={payout} />
                    ) : (
                        <MyTicket markets={markets} totalQuote={totalQuote} paid={paid} payout={payout} />
                    )}
                    <TwitterShare disabled={isLoading} onClick={onTwitterShareClick}>
                        <TwitterIcon disabled={isLoading} fontSize={'30px'} />
                        <TwitterShareLabel>{t('markets.parlay.share-ticket.share')}</TwitterShareLabel>
                    </TwitterShare>
                </Container>
            </ReactModal>
        </>
    );
};

const Container = styled(FlexDivColumnCentered)`
    min-width: 300px;
    max-width: 400px;
    padding: 15px;
    flex: none;
    background: linear-gradient(180deg, #303656 0%, #1a1c2b 100%);
    border-radius: 10px;
`;

const CloseIcon = styled.i`
    position: absolute;
    top: -25px;
    right: -25px;
    font-size: 20px;
    cursor: pointer;
    color: #ffffff;
`;

const TwitterShare = styled(FlexDivColumnCentered)<{ disabled?: boolean }>`
    align-items: center;
    position: absolute;
    left: 0;
    right: 0;
    bottom: -100px;
    margin-left: auto;
    margin-right: auto;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: linear-gradient(217.61deg, #123eae 9.6%, #3ca8ca 78.9%);
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    opacity: ${(props) => (props.disabled ? '0.4' : '1')};
`;

const TwitterShareLabel = styled.span`
    font-weight: 800;
    font-size: 18px;
    line-height: 25px;
    text-transform: uppercase;
    color: #ffffff;
`;

export default React.memo(ShareTicketModal);