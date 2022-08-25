import React, { CSSProperties, MouseEventHandler } from 'react';
import styled from 'styled-components';
import { navigateTo } from 'utils/routes';

type FieldValidationMessageProps = {
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement> | undefined;
    style?: CSSProperties;
    href: string;
    state?: string;
};

const ifIpfsDeployment = process.env.REACT_APP_IPFS_DEPLOYMENT === 'true';

const SPAAnchor: React.FC<FieldValidationMessageProps> = ({ onClick, children, href, style, className, state }) => {
    return (
        <>
            {ifIpfsDeployment ? (
                <Anchor className={className} style={style} href={href}>
                    {children}
                </Anchor>
            ) : (
                <Anchor
                    className={className}
                    style={style}
                    href={href}
                    onClick={(event) => {
                        event.preventDefault();
                        onClick && onClick(event);
                        navigateTo(href, false, false, state);
                    }}
                >
                    {children}
                </Anchor>
            )}
        </>
    );
};

const Anchor = styled.a`
    all: unset;
`;

export default SPAAnchor;
